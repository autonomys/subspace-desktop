#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

#[cfg(target_os = "linux")]
mod linux;
#[cfg(target_os = "windows")]
mod windows;

mod farmer;
mod menu;
mod node;
mod utils;

use anyhow::Result;
use std::fs::create_dir_all;
use tauri::SystemTrayEvent;
use tauri::{Manager, RunEvent, WindowEvent};
use tracing::level_filters::LevelFilter;
use tracing_bunyan_formatter::{BunyanFormattingLayer, JsonStorageLayer};
use tracing_subscriber::prelude::*;
use tracing_subscriber::Layer;
use tracing_subscriber::{fmt, fmt::format::FmtSpan, EnvFilter};

const KEEP_LAST_N_DAYS: usize = 7;

#[tokio::main]
async fn main() -> Result<()> {
    let ctx = tauri::generate_context!();
    let log_dir = utils::custom_log_dir(&ctx.config().tauri.bundle.identifier);
    create_dir_all(log_dir.clone()).expect("path creation should always succeed");

    let mut file_appender = tracing_appender::rolling::daily(log_dir, "subspace-desktop.log");
    file_appender.keep_last_n_logs(KEEP_LAST_N_DAYS); // keep the logs of last 7 days only

    // filter for logging
    let filter = || {
        EnvFilter::builder()
            .with_default_directive(LevelFilter::INFO.into())
            .from_env_lossy()
            .add_directive("subspace_farmer=debug".parse().unwrap())
    };

    // start logger, after we acquire the bundle identifier
    tracing_subscriber::registry()
        .with(
            fmt::layer()
                .with_ansi(!cfg!(windows))
                .with_span_events(FmtSpan::CLOSE)
                .with_filter(filter()),
        )
        .with(
            BunyanFormattingLayer::new("subspace-desktop".to_owned(), file_appender)
                .and_then(JsonStorageLayer)
                .with_filter(filter()),
        )
        .init();

    // building the application
    let app = tauri::Builder::default()
        .setup(|app| {
            #[cfg(debug_assertions)] // only include this code on debug builds
            {
                app.get_window("main").unwrap().open_devtools();
            }
            Ok(())
        })
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
            #[cfg(target_os = "macos")]
            tauri::generate_handler![
                farmer::farming,
                farmer::validate_reward_address,
                node::start_node,
                utils::frontend_error_logger,
                utils::frontend_info_logger,
                utils::open_log_dir,
                utils::get_disk_stats,
                utils::get_this_binary,
                utils::write_config,
                utils::read_config,
                utils::remove_config,
                utils::create_dir,
                utils::remove_dir,
                utils::entry_count_directory,
            ],
            #[cfg(target_os = "linux")]
            tauri::generate_handler![
                farmer::farming,
                farmer::validate_reward_address,
                node::start_node,
                utils::frontend_error_logger,
                utils::frontend_info_logger,
                utils::open_log_dir,
                utils::get_disk_stats,
                utils::get_this_binary,
                utils::write_config,
                utils::read_config,
                utils::remove_config,
                utils::create_dir,
                utils::remove_dir,
                utils::entry_count_directory,
                linux::create_linux_auto_launch_file,
                linux::linux_auto_launch_file_exist,
                linux::remove_linux_auto_launch_file,
            ],
            #[cfg(target_os = "windows")]
            tauri::generate_handler![
                farmer::farming,
                farmer::validate_reward_address,
                node::start_node,
                utils::frontend_error_logger,
                utils::frontend_info_logger,
                utils::open_log_dir,
                utils::get_disk_stats,
                utils::get_this_binary,
                utils::write_config,
                utils::read_config,
                utils::remove_config,
                utils::create_dir,
                utils::remove_dir,
                utils::entry_count_directory,
                windows::winreg_get,
                windows::winreg_set,
                windows::winreg_delete,
            ],
        )
        .build(ctx)
        .expect("error while running tauri application");

    // running the application
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
