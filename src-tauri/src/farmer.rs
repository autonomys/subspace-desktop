use anyhow::{anyhow, Error, Result};
use futures::stream::FuturesUnordered;
use futures::StreamExt;
use std::future::Future;
use std::path::PathBuf;
use std::sync::Arc;
use subspace_core_primitives::PublicKey;
use subspace_farmer::single_disk_farm::{SingleDiskFarm, SingleDiskFarmOptions};
use subspace_farmer::single_plot_farm::PlotFactoryOptions;
use subspace_farmer::{NodeRpcClient, Plot, RpcClient};
use subspace_networking::libp2p::{multiaddr::Protocol, Multiaddr};
use subspace_networking::{Config, RelayMode};
use tokio::time::{sleep, timeout, Duration};
use tracing::{debug, error, info, trace, warn};

const GEMINI_2A_GENESIS_HASH: [u8; 32] = [
    0x43, 0xd1, 0x0f, 0xfd, 0x50, 0x99, 0x03, 0x80, 0xff, 0xe6, 0xc9, 0x39, 0x21, 0x45, 0x43, 0x1d,
    0x63, 0x0a, 0xe6, 0x7e, 0x89, 0xdb, 0xc9, 0xc0, 0x14, 0xca, 0xc2, 0xa4, 0x17, 0x75, 0x91, 0x01,
];
// 100GiB
const GEMINI_2A_MAX_ALLOCATED_SIZE: u64 = 100 * 1024 * 1024 * 1024;

#[derive(Clone)]
struct FarmingArgs {
    node_rpc_url: String,
    reward_address: PublicKey,
    listen_on: Vec<Multiaddr>,
    bootstrap_nodes: Vec<Multiaddr>,
    archiving: ArchivingFrom,
    dsn_sync: bool,
}

#[derive(Debug, Clone)]
struct DiskFarm {
    /// Path to directory where plots are stored, typically HDD.
    plot_directory: PathBuf,
    /// Path to directory for storing metadata, typically SSD.
    metadata_directory: PathBuf,
    /// How much space in bytes can farm use for plots (metadata space is not included)
    allocated_plotting_space: u64,
}

#[allow(dead_code)] // Dsn is not active now, will be enabled later. Wanted to keep the struct as it is in monorepo
#[derive(Debug, Clone, Copy)]
enum ArchivingFrom {
    /// Sync from node using RPC endpoint (recommended)
    Rpc,
    /// Sync from node using DSN (experimental)
    Dsn,
}

/// the default strategy for syncing
impl Default for ArchivingFrom {
    fn default() -> Self {
        Self::Rpc
    }
}

#[tauri::command]
pub(crate) fn validate_reward_address(addr: &str) -> bool {
    parse_reward_address(addr).is_ok()
}

/// manages the `farm` process
/// waits on the `farm` handle, and restarts the `farm` process if needed
#[tauri::command]
pub(crate) async fn farming(
    path: String,
    reward_address: String,
    plot_size: u64,
) -> Result<(), String> {
    if let Ok(address) = parse_reward_address(&reward_address) {
        let farming_args = FarmingArgs {
            node_rpc_url: "ws://127.0.0.1:9947".to_string(),
            reward_address: address,
            listen_on: vec!["/ip4/127.0.0.1/tcp/40333"
                .parse()
                .expect("the address is hardcoded and correct")],
            bootstrap_nodes: vec![],
            archiving: ArchivingFrom::Rpc,
            dsn_sync: false,
        };

        let disk_farms = vec![DiskFarm {
            plot_directory: path.clone().into(),
            metadata_directory: path.clone().into(),
            allocated_plotting_space: get_usable_plot_space(plot_size),
        }];

        let mut farming_handle = farm(disk_farms.clone(), farming_args.clone())
            .await
            .map_err(|error| format!("farm function failed to start, with error: {error}"))?;

        tokio::spawn(async move {
            match farming_handle.next().await {
                Some(Err(error)) => error!("farmer instance crashed with error: {error}"),
                Some(Ok(_)) => debug!("Node should have been restarted, restarting farmer now"),
                _ => unreachable!("there should be at least one farming"),
            }
            loop {
                match farm(disk_farms.clone(), farming_args.clone()).await {
                    Err(error) => {
                        error!("farm function failed to start, with error: {error}")
                    }
                    Ok(mut handle) => match handle.next().await {
                        Some(Err(error)) => error!("farmer instance crashed with error: {error}"),
                        Some(Ok(_)) => {
                            debug!("Node should have been restarted, restarting farmer now")
                        }
                        _ => unreachable!("there should be at least one farming"),
                    },
                }
            }
        });

        return Ok(());
    }
    Err("could not parse the reward address in the backend".into())
}

/// Start farming by using plot in specified path and connecting to WebSocket server at specified
/// address.
async fn farm(
    disk_farms: Vec<DiskFarm>,
    farming_args: FarmingArgs,
) -> Result<FuturesUnordered<impl Future<Output = Result<(), Error>>>, anyhow::Error> {
    raise_fd_limit();

    let FarmingArgs {
        bootstrap_nodes,
        listen_on,
        node_rpc_url,
        reward_address,
        dsn_sync,
        archiving,
    } = farming_args;

    // ping node to discover whether it is listening
    if let Err(error) = timeout(Duration::from_secs(10), async {
        loop {
            if NodeRpcClient::new(&node_rpc_url).await.is_ok() {
                break;
            } else {
                sleep(Duration::from_millis(500)).await;
            }
        }
    })
    .await
    {
        error!("Node is not responding for 10 seconds, farmer is unable to start");
        return Err(anyhow!(error));
    }

    let mut single_disk_farms = Vec::with_capacity(disk_farms.len());
    let mut record_size = None;
    let mut recorded_history_segment_size = None;

    if disk_farms.is_empty() {
        return Err(anyhow!("There must be a disk farm provided"));
    }

    // Starting the relay server node.
    let (relay_server_node, mut relay_node_runner) = subspace_networking::create(Config {
        listen_on,
        allow_non_globals_in_dht: true,
        relay_mode: RelayMode::Server,
        ..Config::with_generated_keypair()
    })
    .await?;

    relay_server_node
        .on_new_listener(Arc::new({
            let node_id = relay_server_node.id();

            move |multiaddr| {
                info!(
                    "Relay listening on {}",
                    multiaddr.clone().with(Protocol::P2p(node_id.into()))
                );
            }
        }))
        .detach();

    tokio::spawn(async move {
        relay_node_runner.run().await;
    });

    trace!(node_id = %relay_server_node.id(), "Relay Node started");

    // TODO: Check plot and metadata sizes to ensure there is enough space for farmer to not
    //  fail later (note that multiple farms can use the same location for metadata)
    for (farm_index, mut disk_farm) in disk_farms.into_iter().enumerate() {
        if disk_farm.allocated_plotting_space < 1024 * 1024 {
            return Err(anyhow::anyhow!(
                "Plot size is too low ({0} bytes). Did you mean {0}G or {0}T?",
                disk_farm.allocated_plotting_space
            ));
        }
        info!("Connecting to node at {}", node_rpc_url);
        let archiving_client = NodeRpcClient::new(&node_rpc_url).await?;
        let farming_client = NodeRpcClient::new(&node_rpc_url).await?;
        let farmer_protocol_info = farming_client
            .farmer_protocol_info()
            .await
            .map_err(|error| anyhow!(error))?;

        if farmer_protocol_info.genesis_hash == GEMINI_2A_GENESIS_HASH {
            if farm_index > 0 {
                warn!("This chain only supports one disk farm");
                break;
            }

            if disk_farm.allocated_plotting_space > GEMINI_2A_MAX_ALLOCATED_SIZE {
                warn!(
                    "This chain only supports up to 100GiB of allocated space, force-limiting \
                    allocated space to 100GiB"
                );

                disk_farm.allocated_plotting_space = GEMINI_2A_MAX_ALLOCATED_SIZE;
            }
        }

        record_size.replace(farmer_protocol_info.record_size);
        recorded_history_segment_size.replace(farmer_protocol_info.recorded_history_segment_size);

        let single_disk_farm = SingleDiskFarm::new(SingleDiskFarmOptions {
            plot_directory: disk_farm.plot_directory,
            metadata_directory: disk_farm.metadata_directory,
            allocated_plotting_space: disk_farm.allocated_plotting_space,
            farmer_protocol_info,
            disk_concurrency: std::num::NonZeroU16::new(2).expect("hard-coded value is correct"),
            archiving_client,
            farming_client,
            reward_address,
            bootstrap_nodes: bootstrap_nodes.clone(),
            listen_on: vec![],
            enable_dsn_archiving: matches!(archiving, ArchivingFrom::Dsn),
            enable_dsn_sync: dsn_sync,
            enable_farming: true,
            plot_factory: move |options: PlotFactoryOptions<'_>| {
                Plot::open_or_create(
                    options.single_plot_farm_id,
                    options.plot_directory,
                    options.metadata_directory,
                    options.public_key,
                    options.max_plot_size,
                )
            },
            relay_server_node: Some(relay_server_node.clone()),
        })
        .await?;

        single_disk_farms.push(single_disk_farm);
    }

    let single_disk_farms_stream = single_disk_farms
        .into_iter()
        .map(|single_disk_farm| single_disk_farm.wait())
        .collect::<FuturesUnordered<_>>();

    //Ok(single_disk_farms_stream)
    Ok(single_disk_farms_stream)
}

fn raise_fd_limit() {
    match std::panic::catch_unwind(fdlimit::raise_fd_limit) {
        Ok(Some(limit)) => {
            info!("Increase file limit from soft to hard (limit is {limit})")
        }
        Ok(None) => debug!("Failed to increase file limit"),
        Err(err) => {
            let err = if let Some(err) = err.downcast_ref::<&str>() {
                *err
            } else if let Some(err) = err.downcast_ref::<String>() {
                err
            } else {
                unreachable!("Should be unreachable as `fdlimit` uses panic macro, which should return either `&str` or `String`.")
            };
            warn!("Failed to increase file limit: {err}")
        }
    }
}

fn parse_reward_address(s: &str) -> Result<PublicKey, sp_core::crypto::PublicError> {
    s.parse::<sp_core::sr25519::Public>()
        .map(|key| PublicKey::from(key.0))
}

fn get_usable_plot_space(allocated_space: u64) -> u64 {
    // TODO: Should account for database overhead of various additional databases.
    //  For now assume 92% will go for plot itself
    allocated_space * 92 / 100
}
