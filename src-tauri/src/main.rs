#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

#[cfg(target_os = "windows")]
mod windows;

use anyhow::{anyhow, Result};
use bip39::{Language, Mnemonic};
use log::{debug, info};
use serde::Serialize;
use std::path::PathBuf;
use subspace_farmer::{
    Commitments, Farming, Identity, ObjectMappings, Plot, Plotting, RpcClient, WsRpc,
};
use subspace_solving::SubspaceCodec;
use tauri::{
    api::{self},
    CustomMenuItem, Event, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu,
    SystemTrayMenuItem,
};

#[derive(Serialize)]
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
async fn farming(path: String) -> FarmerIdentity {
    let farmer_identity = farm(path.into(), "ws://127.0.0.1:9944").await;
    farmer_identity.unwrap()
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
            tauri::generate_handler![get_disk_stats, get_this_binary, farming],
            #[cfg(target_os = "windows")]
            tauri::generate_handler![
                windows::winreg_get,
                windows::winreg_set,
                windows::winreg_delete,
                get_this_binary,
                get_disk_stats,
                farming,
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

/// Start farming by using plot in specified path and connecting to WebSocket server at specified
/// address.
pub(crate) async fn farm(
    base_directory: PathBuf,
    node_rpc_url: &str,
) -> Result<FarmerIdentity, anyhow::Error> {
    // TODO: This doesn't account for the fact that node can
    // have a completely different history to what farmer expects
    info!("Opening plot");
    let plot_fut = tokio::task::spawn_blocking({
        let base_directory = base_directory.clone();

        move || Plot::open_or_create(&base_directory)
    });
    let plot = plot_fut.await.unwrap()?;

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

    let identity = Identity::open_or_create(&base_directory)?;

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

    Ok(FarmerIdentity {
        public_key: identity.public_key().to_bytes(),
        mnemonic: Mnemonic::from_entropy(identity.entropy(), Language::English)
            .unwrap()
            .into_phrase(),
    })
}
