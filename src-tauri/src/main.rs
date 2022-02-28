#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

#[cfg(target_os = "windows")]
mod windows;

#[macro_use]
extern crate dotenv_codegen;

use anyhow::{anyhow, Result};
use bip39::{Language, Mnemonic};
use dotenv::dotenv;
use log::{debug, info};
use sc_cli::{ChainSpec, SubstrateCli};
use sc_executor::NativeExecutionDispatch;
use serde::Serialize;
use sp_core::crypto::Ss58AddressFormat;
use std::path::PathBuf;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use subspace_core_primitives::PIECE_SIZE;
use subspace_farmer::{
    Commitments, Farming, Identity, ObjectMappings, Plot, Plotting, RpcClient, WsRpc,
};
use subspace_node::{cli::Cli, Error};
use subspace_solving::SubspaceCodec;
use tauri::{
    api::{self},
    CustomMenuItem, Event, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu,
    SystemTrayMenuItem,
};

static PLOTTED_PIECES: AtomicUsize = AtomicUsize::new(0);

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct FarmerIdentity {
    public_key: [u8; 32],
    mnemonic: String,
}

#[derive(Serialize)]
struct DiskStats {
    free_bytes: u64,
    total_bytes: u64,
}

#[tauri::command]
fn plot_progress_tracker() -> usize {
    PLOTTED_PIECES.load(Ordering::Relaxed)
}

#[tauri::command]
async fn farming(path: String) {
    farm(path.into(), "ws://127.0.0.1:9944").await.unwrap();
}

#[tauri::command]
async fn start_node(path: String) -> FarmerIdentity {
    init_node(path.into()).await.unwrap()
}

#[tauri::command]
fn get_disk_stats(dir: String) -> DiskStats {
    debug!("{}", dir);
    let free: u64 = fs2::available_space(&dir).expect("error");
    let total: u64 = fs2::total_space(&dir).expect("error");

    DiskStats {
        free_bytes: free,
        total_bytes: total,
    }
}

#[tauri::command]
fn get_this_binary() -> PathBuf {
    let bin = api::process::current_binary();
    bin.unwrap()
}

#[tokio::main]
async fn main() -> Result<()> {
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let toggle_visibility = CustomMenuItem::new("toggle_visibility".to_string(), "Hide");

    let tray_menu = SystemTrayMenu::new()
        .add_item(toggle_visibility)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(quit);
    let tray = SystemTray::new().with_menu(tray_menu);

    let app = tauri::Builder::default()
        .system_tray(tray)
        .on_system_tray_event(|app, event| {
            if let SystemTrayEvent::MenuItemClick { id, .. } = event {
                let item_handle = app.tray_handle().get_item(&id);
                match id.as_str() {
                    "quit" => {
                        std::process::exit(0); // hide window
                    }
                    "toggle_visibility" => {
                        let window = app.get_window("main").unwrap();
                        if window.is_visible().unwrap() {
                            window.hide().unwrap();
                            //#[cfg(target_os = "macos")]
                            // app.set_activation_policy(tauri::ActivationPolicy::Accessory); // TODO This should hide the main taskbar icon when the window is hidden, however there is a borrow error

                            item_handle.set_title("Show").unwrap();
                        } else {
                            window.show().unwrap();
                            //#[cfg(target_os = "macos")]
                            // app.set_activation_policy(tauri::ActivationPolicy::Regular); // TODO This should show the main taskbar icon when the window is visible, however there is a borrow error
                            item_handle.set_title("Hide").unwrap();
                        }
                    }
                    _ => {}
                }
            }
        })
        .invoke_handler(
            #[cfg(not(target_os = "windows"))]
            tauri::generate_handler![
                get_disk_stats,
                get_this_binary,
                farming,
                plot_progress_tracker,
                start_node
            ],
            #[cfg(target_os = "windows")]
            tauri::generate_handler![
                windows::winreg_get,
                windows::winreg_set,
                windows::winreg_delete,
                get_this_binary,
                get_disk_stats,
                farming,
                plot_progress_tracker,
                start_node
            ],
        )
        .build(tauri::generate_context!())
        .expect("error while running tauri application");

    app.run(|app_handle, e| match e {
        Event::CloseRequested { label, api, .. } => {
            let app_handle = app_handle.clone();
            let window = app_handle.get_window(&label).unwrap();
            // use the exposed close api, and prevent the event loop to close
            api.prevent_close();
            // hide the window
            window.hide().unwrap();
            // TODO This should hide the main taskbar icon when the window is closed on macos, however there is a borrow error
            // #[cfg(target_os = "macos")]
            // app.set_activation_policy(tauri::ActivationPolicy::Accessory);
            let tray_handle = app_handle.tray_handle();
            let item_handle = tray_handle.get_item("toggle_visibility");
            item_handle.set_title("Show").unwrap(); // update the tray menu title to reflect the hidden state of the window
        }
        Event::ExitRequested { api, .. } => {
            api.prevent_exit();
        }
        _ => {}
    });

    Ok(())
}

pub(crate) async fn init_node(base_directory: PathBuf) -> Result<FarmerIdentity, anyhow::Error> {
    let identity = Identity::open_or_create(&base_directory)?;
    let public_key = identity.public_key().to_bytes();
    let mut name = hex::encode(public_key.as_slice());
    name.truncate(32);
    // TODO: Could be a better way to pass this value to run_node.
    let base_path: String = base_directory.as_path().display().to_string();
    // start the node, and take the public key as the name parameter
    // also send base-path to avoid using default node database directory.
    std::thread::spawn(move || run_node(name.as_str(), &base_path));

    Ok(FarmerIdentity {
        public_key,
        mnemonic: Mnemonic::from_entropy(identity.entropy(), Language::English)
            .unwrap()
            .into_phrase(),
    })
}

/// Start farming by using plot in specified path and connecting to WebSocket server at specified
/// address.
pub(crate) async fn farm(base_directory: PathBuf, node_rpc_url: &str) -> Result<()> {
    let identity = Identity::open_or_create(&base_directory)?;

    info!("Opening plot");
    let plot_fut = tokio::task::spawn_blocking({
        let base_directory = base_directory.clone();

        move || Plot::open_or_create(&base_directory)
    });

    let plot = plot_fut.await.unwrap()?;

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

    info!("Connecting to node at {}", node_rpc_url);
    let client = WsRpc::new(node_rpc_url).await?;

    let farmer_metadata = client
        .farmer_metadata()
        .await
        .map_err(|error| anyhow::Error::msg(error.to_string()))?;

    let subspace_codec = SubspaceCodec::new(identity.public_key());

    // start the farming task
    let farming_instance = Farming::start(
        plot.clone(),
        commitments.clone(),
        client.clone(),
        identity.clone(),
    );

    // start the background plotting
    let plotting_instance = Plotting::start(
        plot,
        commitments,
        object_mappings,
        client,
        farmer_metadata,
        subspace_codec,
    );

    // wait for the farming and plotting in the background
    tokio::spawn(async {
        tokio::select! {
            res = plotting_instance.wait() => if let Err(error) = res {
                return Err(anyhow!(error)) // TODO: connect this error to frontend, or log it
            },
            res = farming_instance.wait() => if let Err(error) = res {
                return Err(anyhow!(error)) // TODO: connect this error to frontend, or log it
            },
        }
        Ok(())
    });

    Ok(())
}

fn run_node(id: &str, base_path: &String) -> Result<(), Error> {
    dotenv().ok();
    let args = vec![
        "--",
        "--chain",
        dotenv!("CHAIN_SPEC_FILE"),
        "--wasm-execution",
        "compiled",
        "--execution",
        "wasm",
        "--bootnodes",
        dotenv!("BOOTNODE"),
        "--rpc-cors",
        "all",
        "--rpc-methods",
        "unsafe",
        "--ws-external",
        "--validator",
        "--telemetry-url",
        "wss://telemetry.polkadot.io/submit/ 1",
        "--name",
        id,
        "--base-path",
        base_path,
    ];
    let cli = Cli::from_iter(args);

    let runner = cli.create_runner(&cli.run.base)?;

    set_default_ss58_version(&runner.config().chain_spec);

    println!("ss58 version set successfully");
    runner.run_node_until_exit(|config| async move {
        subspace_service::new_full::<subspace_runtime::RuntimeApi, ExecutorDispatch>(config, true)
            .await
            .map(|full| full.task_manager)
    })?;

    println!("runner started successfully");

    Ok(())
}

struct ExecutorDispatch;

impl NativeExecutionDispatch for ExecutorDispatch {
    /// Only enable the benchmarking host functions when we actually want to benchmark.
    #[cfg(feature = "runtime-benchmarks")]
    type ExtendHostFunctions = frame_benchmarking::benchmarking::HostFunctions;
    /// Otherwise we only use the default Substrate host functions.
    #[cfg(not(feature = "runtime-benchmarks"))]
    type ExtendHostFunctions = ();

    fn dispatch(method: &str, data: &[u8]) -> Option<Vec<u8>> {
        subspace_runtime::api::dispatch(method, data)
    }

    fn native_version() -> sc_executor::NativeVersion {
        subspace_runtime::native_version()
    }
}

fn set_default_ss58_version<C: AsRef<dyn ChainSpec>>(chain_spec: C) {
    let maybe_ss58_address_format = chain_spec
        .as_ref()
        .properties()
        .get("ss58Format")
        .map(|v| {
            v.as_u64()
                .expect("ss58Format must always be an unsigned number; qed")
        })
        .map(|v| {
            v.try_into()
                .expect("ss58Format must always be within u16 range; qed")
        })
        .map(Ss58AddressFormat::custom);

    if let Some(ss58_address_format) = maybe_ss58_address_format {
        sp_core::crypto::set_default_ss58_version(ss58_address_format);
    }
}
