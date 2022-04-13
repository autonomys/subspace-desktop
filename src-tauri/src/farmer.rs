use anyhow::Result;
use bip39::{Language, Mnemonic};
use log::{debug, error, info};
use std::path::PathBuf;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use std::time::Duration;
use subspace_core_primitives::{PublicKey, PIECE_SIZE};
use subspace_farmer::{
    Commitments, FarmerData, Farming, Identity, ObjectMappings, Plot, Plotting, RpcClient, WsRpc,
};
use subspace_solving::SubspaceCodec;

pub(crate) static PLOTTED_PIECES: AtomicUsize = AtomicUsize::new(0);
const BEST_BLOCK_NUMBER_CHECK_INTERVAL: Duration = Duration::from_secs(5);

pub(crate) fn create_identity(base_directory: PathBuf) -> Result<String> {
    let identity = Identity::open_or_create(&base_directory)?;

    Ok(
        Mnemonic::from_entropy(identity.entropy(), Language::English)
            .unwrap()
            .into_phrase(),
    )
}

/// Start farming by using plot in specified path and connecting to WebSocket server at specified
/// address.
pub(crate) async fn farm(
    base_directory: PathBuf,
    node_rpc_url: &str,
    reward_address: Option<PublicKey>,
    plot_size: u64,
) -> Result<()> {
    let identity = Identity::open_or_create(&base_directory)?;
    let address = identity.public_key().to_bytes().into();

    let reward_address = reward_address.unwrap_or_else(|| identity.public_key().to_bytes().into());

    info!("Connecting to node at {}", node_rpc_url);
    let client = WsRpc::new(node_rpc_url).await?;

    let farmer_metadata = client
        .farmer_metadata()
        .await
        .map_err(|error| anyhow::Error::msg(error.to_string()))?;

    // TODO: This doesn't account for the fact that node can
    // have a completely different history to what farmer expects
    info!("Opening plot");
    let plot_fut = tokio::task::spawn_blocking({
        let base_directory = base_directory.clone();
        let plot_size = plot_size / PIECE_SIZE as u64;

        // TODO: Piece count should account for database overhead of various additional databases
        move || Plot::open_or_create(&base_directory, address, Some(plot_size))
    });
    let plot = plot_fut.await.unwrap()?;

    // Keep track of the plotting for Desktop App
    plot.on_progress_change(Arc::new(|plotted_pieces| {
        PLOTTED_PIECES.fetch_add(
            plotted_pieces.plotted_piece_count / PIECE_SIZE,
            Ordering::SeqCst,
        );
        debug!(
            "Plotted pieces so far: {}",
            PLOTTED_PIECES.load(Ordering::Relaxed)
        );
    }))
    .detach();

    info!("Opening commitments");
    let commitments_fut = tokio::task::spawn_blocking({
        let path = base_directory.join("commitments");

        move || Commitments::new(path)
    });
    let commitments = commitments_fut.await.unwrap()?;

    info!("Opening object mapping");
    let object_mappings = tokio::task::spawn_blocking({
        let base_directory = base_directory.clone();

        move || ObjectMappings::open_or_create(&base_directory)
    })
    .await??;

    let subspace_codec = SubspaceCodec::new(identity.public_key());

    // start the farming task
    let farming_instance = Farming::start(
        plot.clone(),
        commitments.clone(),
        client.clone(),
        identity,
        reward_address,
    );

    let farmer_data = FarmerData::new(plot, commitments, object_mappings, farmer_metadata);

    // start the background plotting
    let plotting_instance = Plotting::start(
        farmer_data,
        client,
        subspace_codec,
        BEST_BLOCK_NUMBER_CHECK_INTERVAL,
    );

    // wait for the farming and plotting in the background
    tokio::spawn(async {
        tokio::select! {
            res = plotting_instance.wait() => if let Err(error) = res {
                error!("Plotting created the error: {error}");
            },
            res = farming_instance.wait() => if let Err(error) = res {
                error!("Farming created the error: {error}");
            },
        }
    });

    Ok(())
}

pub(crate) fn parse_reward_address(s: &str) -> Result<PublicKey, sp_core::crypto::PublicError> {
    s.parse::<sp_core::sr25519::Public>()
        .map(|key| PublicKey::from(key.0))
}
