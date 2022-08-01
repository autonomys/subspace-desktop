use anyhow::{anyhow, Result};
use std::path::PathBuf;
use std::sync::Arc;
use subspace_core_primitives::PublicKey;
use subspace_farmer::legacy_multi_plots_farm::{
    LegacyMultiPlotsFarm, Options as MultiFarmingOptions,
};
use subspace_farmer::single_plot_farm::PlotFactoryOptions;
use subspace_farmer::{Identity, LegacyObjectMappings, NodeRpcClient, Plot, RpcClient};
use subspace_networking::libp2p::{multiaddr::Protocol, Multiaddr};
use subspace_networking::Config;
use tokio::time::{sleep, timeout, Duration};
use tracing::{debug, error, info, trace, warn};

#[derive(Clone)]
struct FarmingArgs {
    node_rpc_url: String,
    reward_address: Option<PublicKey>,
    plot_size: u64,
    listen_on: Vec<Multiaddr>,
    bootstrap_nodes: Vec<Multiaddr>,
    archiving: ArchivingFrom,
    dsn_sync: bool,
}

#[allow(dead_code)] // Dsn is not active now, will be enabled later. Wanted to keep the struct as it is in monorepo
#[derive(Debug, Clone, Copy)]
enum ArchivingFrom {
    /// Sync from node using RPC endpoint (recommended)
    Rpc,
    /// Sync from node using DSN (experimental)
    Dsn,
}

impl Default for ArchivingFrom {
    fn default() -> Self {
        Self::Rpc
    }
}

#[tauri::command]
pub(crate) async fn farming(
    path: String,
    reward_address: String,
    plot_size: u64,
) -> Result<String, String> {
    if let Ok(address) = parse_reward_address(&reward_address) {
        let farming_args = FarmingArgs {
            node_rpc_url: "ws://127.0.0.1:9947".to_string(),
            reward_address: Some(address),
            plot_size,
            listen_on: vec!["/ip4/127.0.0.1/tcp/40333"
                .parse()
                .expect("the address is hardcoded and correct")],
            bootstrap_nodes: vec![],
            archiving: ArchivingFrom::Rpc,
            dsn_sync: false,
        };

        tokio::spawn(async move {
            loop {
                match farm(path.clone().into(), farming_args.clone()).await {
                    Err(err) => error!("farm function failed to start, with error: {err}"),
                    Ok(farming_handle) => {
                        let result = farming_handle.wait().await;
                        match result {
                            Err(error) => {
                                error!("{error}");
                            }
                            Ok(_) => {
                                debug!("Node should have been restarted, restarting farmer now");
                            }
                        }
                    }
                }
            }
        });
        return Ok("Successfully started the farmer in the backend".into());
    }
    Err("could not parse the reward address in the backend".into())
}

/// Start farming by using plot in specified path and connecting to WebSocket server at specified
/// address.
async fn farm(
    base_directory: PathBuf,
    farm_args: FarmingArgs,
) -> Result<LegacyMultiPlotsFarm, anyhow::Error> {
    let FarmingArgs {
        node_rpc_url,
        reward_address,
        plot_size,
        listen_on,
        bootstrap_nodes,
        archiving,
        dsn_sync,
    } = farm_args;

    raise_fd_limit();

    let reward_address = if let Some(reward_address) = reward_address {
        reward_address
    } else {
        let identity = Identity::open_or_create(&base_directory)?;
        identity.public_key().to_bytes().into()
    };

    if plot_size < 1024 * 1024 {
        return Err(anyhow::anyhow!(
            "Plot size is too low ({0} bytes). Did you mean {0}G or {0}T?",
            plot_size
        ));
    }

    info!("Connecting to node at {}", node_rpc_url);
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
    let archiving_client = NodeRpcClient::new(&node_rpc_url).await?;
    let farming_client = NodeRpcClient::new(&node_rpc_url).await?;

    let farmer_protocol_info = farming_client
        .farmer_protocol_info()
        .await
        .map_err(|error| anyhow!(error))?;

    info!("Opening object mapping");
    let object_mappings = tokio::task::spawn_blocking({
        let path = base_directory.join("object-mappings");

        move || LegacyObjectMappings::open_or_create(path)
    })
    .await??;

    // Starting the relay server node.
    let (relay_server_node, mut relay_node_runner) = subspace_networking::create(Config {
        listen_on,
        allow_non_globals_in_dht: true,
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

    let usable_space = get_usable_plot_space(plot_size);
    let multi_plots_farm = LegacyMultiPlotsFarm::new(
        MultiFarmingOptions {
            base_directory,
            farmer_protocol_info,
            archiving_client,
            farming_client,
            object_mappings: object_mappings.clone(),
            reward_address,
            bootstrap_nodes,
            enable_dsn_archiving: matches!(archiving, ArchivingFrom::Dsn),
            enable_dsn_sync: dsn_sync,
            enable_farming: true,
            listen_on: vec![],
            relay_server_node: Some(relay_server_node),
        },
        usable_space,
        move |options: PlotFactoryOptions<'_>| {
            Plot::open_or_create(
                options.single_plot_farm_id,
                options.plot_directory,
                options.metadata_directory,
                options.public_key,
                options.max_plot_size,
            )
        },
    )
    .await?;

    Ok(multi_plots_farm)
}

fn parse_reward_address(s: &str) -> Result<PublicKey, sp_core::crypto::PublicError> {
    s.parse::<sp_core::sr25519::Public>()
        .map(|key| PublicKey::from(key.0))
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

fn get_usable_plot_space(allocated_space: u64) -> u64 {
    // TODO: Should account for database overhead of various additional databases.
    //  For now assume 92% will go for plot itself
    allocated_space * 92 / 100
}
