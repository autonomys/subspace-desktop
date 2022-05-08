#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

#[cfg(target_os = "windows")]
mod windows;

mod farmer;
mod menu;
mod node;

use anyhow::Result;
use log::debug;
use serde::Serialize;
use std::path::PathBuf;
use std::sync::atomic::Ordering;
use std::time::Duration;
use tauri::SystemTrayEvent;
use tauri::{
    api::{self},
    Env, Manager, RunEvent, WindowEvent,
};

const BEST_BLOCK_NUMBER_CHECK_INTERVAL: Duration = Duration::from_secs(5);

#[derive(Serialize)]
struct DiskStats {
    free_bytes: u64,
    total_bytes: u64,
}

#[tauri::command]
fn plot_progress_tracker() -> usize {
    farmer::PLOTTED_PIECES.load(Ordering::Relaxed)
}

#[tauri::command]
async fn farming(path: String, reward_address: String, plot_size: u64) -> bool {
    if let Ok(address) = farmer::parse_reward_address(&reward_address) {
        farmer::farm(
            path.into(),
            "ws://127.0.0.1:9944",
            Some(address),
            plot_size,
            BEST_BLOCK_NUMBER_CHECK_INTERVAL,
        )
        .await
        .unwrap();
        true
    } else {
        // reward address could not be parsed, and farmer did not start
        false
    }
}

#[tauri::command]
async fn start_node(path: String) -> String {
    let node_name = node::generate_node_name();
    node::init_node(path.into(), node_name.clone())
        .await
        .unwrap();
    node_name
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
    let bin = api::process::current_binary(&Env::default());
    bin.unwrap()
}

#[tokio::main]
async fn main() -> Result<()> {
    let app = tauri::Builder::default()
        .menu(menu::get_menu())
        .system_tray(menu::get_tray_menu())
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
        RunEvent::WindowEvent {
            label,
            event: WindowEvent::CloseRequested { api, .. },
            ..
        } => {
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
        RunEvent::ExitRequested { api, .. } => {
            api.prevent_exit();
        }
        _ => {}
    });

    Ok(())
}
