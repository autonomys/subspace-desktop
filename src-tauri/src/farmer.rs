use anyhow::{anyhow, Result};
use log::info;
use std::path::PathBuf;
use subspace_core_primitives::PublicKey;
use subspace_farmer::multi_farming::{MultiFarming, Options as MultiFarmingOptions};
use subspace_farmer::{Identity, NodeRpcClient, ObjectMappings, Plot, RpcClient};
use subspace_rpc_primitives::FarmerProtocolInfo;
use tokio::sync::mpsc::{channel, Receiver, Sender};

#[tauri::command]
pub(crate) async fn farming(path: String, reward_address: String, plot_size: u64) -> bool {
    // create a channel to listen for farmer errors, and restart another farmer instance in case any error
    let (error_sender, mut error_receiver): (Sender<()>, Receiver<()>) = channel(1);

    if let Ok(address) = parse_reward_address(&reward_address) {
        farm(
            path.clone().into(),
            "ws://127.0.0.1:9947",
            Some(address),
            plot_size,
            error_sender.clone(),
        )
        .await
        .unwrap();

        // farmer started successfully, now listen in the background for errors
        tokio::spawn(async move {
            // if there is an error, restart another farmer, and start listening again, in a loop
            loop {
                let result = error_receiver.recv().await;
                match result {
                    // we have received an error, let's restart the farmer
                    Some(_) => farm(
                        path.clone().into(),
                        "ws://127.0.0.1:9947",
                        Some(address),
                        plot_size,
                        error_sender.clone(),
                    )
                    .await
                    .unwrap(),
                    None => unreachable!(
                        "sender should not have been dropped before sending an error message"
                    ),
                }
            }
        });
        true
    } else {
        // reward address could not be parsed, and farmer did not start
        false
    }
}

/// Start farming by using plot in specified path and connecting to WebSocket server at specified
/// address.
async fn farm(
    base_directory: PathBuf,
    node_rpc_url: &str,
    reward_address: Option<PublicKey>,
    plot_size: u64,
    error_sender: Sender<()>,
) -> Result<(), anyhow::Error> {
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
    let archiving_client = NodeRpcClient::new(&node_rpc_url).await?;
    let farming_client = NodeRpcClient::new(&node_rpc_url).await?;

    let mut farmer_protocol_info = farming_client
        .farmer_protocol_info()
        .await
        .map_err(|error| anyhow!(error))?;

    let FarmerProtocolInfo {
        record_size,
        recorded_history_segment_size,
        ..
    } = farmer_protocol_info;

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
            enable_farming: !disable_farming,
            relay_server_node,
        },
        plot_size.as_u64(),
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

    tokio::spawn(async move {
        let result = multi_farming.wait().await;
        match result {
            Err(error) => {
                log::error!("{error}");
                error_sender.send(()).await.unwrap() // this send should always be successful
            }
            Ok(_) => unreachable!("wait function should not return Ok()"),
        }
    });

    Ok(())
}

fn parse_reward_address(s: &str) -> Result<PublicKey, sp_core::crypto::PublicError> {
    s.parse::<sp_core::sr25519::Public>()
        .map(|key| PublicKey::from(key.0))
}

fn raise_fd_limit() {
    match std::panic::catch_unwind(fdlimit::raise_fd_limit) {
        Ok(Some(limit)) => {
            log::info!("Increase file limit from soft to hard (limit is {limit})")
        }
        Ok(None) => log::debug!("Failed to increase file limit"),
        Err(err) => {
            let err = if let Some(err) = err.downcast_ref::<&str>() {
                *err
            } else if let Some(err) = err.downcast_ref::<String>() {
                err
            } else {
                unreachable!("Should be unreachable as `fdlimit` uses panic macro, which should return either `&str` or `String`.")
            };
            log::warn!("Failed to increase file limit: {err}")
        }
    }
}
