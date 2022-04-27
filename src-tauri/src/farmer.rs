use anyhow::{anyhow, Result};
use log::info;
use std::path::PathBuf;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use std::time::Duration;
use subspace_core_primitives::{PublicKey, PIECE_SIZE};
use subspace_farmer::multi_farming::MultiFarming;
use subspace_farmer::{Identity, NodeRpcClient, ObjectMappings, RpcClient};
use subspace_rpc_primitives::FarmerMetadata;

pub(crate) static PLOTTED_PIECES: AtomicUsize = AtomicUsize::new(0);

/// Start farming by using plot in specified path and connecting to WebSocket server at specified
/// address.
pub(crate) async fn farm(
    base_directory: PathBuf,
    node_rpc_url: &str,
    reward_address: Option<PublicKey>,
    plot_size: u64,
    best_block_number_check_interval: Duration,
) -> Result<(), anyhow::Error> {
    let reward_address = if let Some(reward_address) = reward_address {
        reward_address
    } else {
        let identity = Identity::open_or_create(&base_directory)?;
        identity.public_key().to_bytes().into()
    };

    info!("Connecting to node at {}", node_rpc_url);
    let client = NodeRpcClient::new(node_rpc_url).await?;

    let FarmerMetadata { max_plot_size, .. } = client
        .farmer_metadata()
        .await
        .map_err(|error| anyhow!(error))?;

    info!("Opening object mapping");
    let object_mappings = tokio::task::spawn_blocking({
        let base_directory = base_directory.clone();

        move || ObjectMappings::open_or_create(&base_directory)
    })
    .await??;

    // TODO: we need to remember plot size in order to prune unused plots in future if plot size is
    // less than it was specified before.
    // TODO: Piece count should account for database overhead of various additional databases
    // For now assume 80% will go for plot itself
    let plot_size = plot_size * 4 / 5 / PIECE_SIZE as u64;

    let plot_sizes = std::iter::repeat(max_plot_size).take((plot_size / max_plot_size) as usize);
    let plot_sizes = if plot_size % max_plot_size > 0 {
        plot_sizes
            .chain(std::iter::once(plot_size % max_plot_size))
            .collect::<Vec<_>>()
    } else {
        plot_sizes.collect()
    };

    let multi_farming = MultiFarming::new(
        base_directory,
        client,
        object_mappings.clone(),
        plot_sizes,
        reward_address,
        best_block_number_check_interval,
    )
    .await?;

    let plots = multi_farming.plots.clone();
    let first_plot = plots.iter().next().unwrap();
    first_plot
        .on_progress_change(Arc::new(|plotted_pieces| {
            PLOTTED_PIECES.fetch_add(
                plotted_pieces.plotted_piece_count / PIECE_SIZE,
                Ordering::SeqCst,
            );
        }))
        .detach();

    tokio::spawn(async { multi_farming.wait().await });

    Ok(())
}

pub(crate) fn parse_reward_address(s: &str) -> Result<PublicKey, sp_core::crypto::PublicError> {
    s.parse::<sp_core::sr25519::Public>()
        .map(|key| PublicKey::from(key.0))
}
