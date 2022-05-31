#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

#[cfg(target_os = "windows")]
mod windows;

mod farmer;
mod menu;
mod node;
mod utils;

use anyhow::Result;
use std::fs::{create_dir_all, File};
use tauri::SystemTrayEvent;
use tauri::{Manager, RunEvent, WindowEvent};
use tracing::level_filters::LevelFilter;
use tracing_subscriber::prelude::*;
use tracing_subscriber::Layer;
use tracing_subscriber::{fmt, fmt::format::FmtSpan, EnvFilter};

#[tokio::main]
async fn main() -> Result<()> {
    let ctx = tauri::generate_context!();
    let id = &ctx.config().tauri.bundle.identifier;
    let log_dir = utils::custom_log_dir(id);
    create_dir_all(log_dir.clone()).expect("path creation should always succeed");
    // start logger, after we acquire the bundle identifier
    tracing_subscriber::registry()
        .with(
            fmt::layer()
                .with_writer(utils::Tee(
                    File::create(log_dir.join(format!("{}.log", id))).unwrap(),
                    std::io::stdout,
                ))
                .with_span_events(FmtSpan::CLOSE)
                .with_filter(
                    EnvFilter::builder()
                        .with_default_directive(LevelFilter::INFO.into())
                        .from_env_lossy()
                        .add_directive("subspace_farmer=debug".parse()?),
                ),
        )
        .init();

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
                utils::get_disk_stats,
                utils::get_this_binary,
                farmer::farming,
                node::start_node,
                utils::frontend_error_logger,
                utils::frontend_info_logger
            ],
            #[cfg(target_os = "windows")]
            tauri::generate_handler![
                windows::winreg_get,
                windows::winreg_set,
                windows::winreg_delete,
                utils::get_disk_stats,
                utils::get_this_binary,
                farmer::farming,
                node::start_node,
                utils::frontend_error_logger,
                utils::frontend_info_logger
            ],
        )
        .build(ctx)
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
