#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

#[cfg(target_os = "windows")]
mod windows;

use serde::Serialize;
use std::path::PathBuf;
use tauri::{
  api::{self},
  CustomMenuItem, Event, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
};

#[derive(Serialize)]
struct DiskStats {
  free_bytes: u64,
  total_bytes: u64,
}

#[tauri::command]
fn get_disk_stats(dir: String) -> DiskStats {
  println!("{}", dir.to_string());
  let free: u64 = fs2::available_space(&dir).expect("error");
  let total: u64 = fs2::total_space(&dir).expect("error");
  return DiskStats {
    free_bytes: free,
    total_bytes: total,
  };
}

#[tauri::command]
fn get_this_binary() -> PathBuf {
  let bin = api::process::current_binary();
  return bin.unwrap();
}

fn main() {
  let quit = CustomMenuItem::new("quit".to_string(), "Quit");
  let toggle_visibility = CustomMenuItem::new("toggle_visibility".to_string(), "Hide");

  let tray_menu = SystemTrayMenu::new()
    .add_item(toggle_visibility)
    .add_native_item(SystemTrayMenuItem::Separator)
    .add_item(quit);
  let tray = SystemTray::new().with_menu(tray_menu);

  #[allow(unused_mut)]
  let mut app = tauri::Builder::default()
    .system_tray(tray)
    .on_system_tray_event(|app, event| match event {
      SystemTrayEvent::MenuItemClick { id, .. } => {
        let item_handle = app.tray_handle().get_item(&id);
        match id.as_str() {
          "quit" => {
            std::process::exit(0); // hide window
          }
          "toggle_visibility" => {
            let window = app.get_window("main").unwrap();
            if window.is_visible().unwrap() {
              window.hide().unwrap();
              item_handle.set_title("Show").unwrap();
            } else {
              window.show().unwrap();
              item_handle.set_title("Hide").unwrap();
            }
          }
          _ => {}
        }
      }
      _ => {}
    })
    .invoke_handler(
      #[cfg(not(target_os = "windows"))]
      tauri::generate_handler![get_disk_stats, get_this_binary],
      #[cfg(target_os = "windows")]
      tauri::generate_handler![
        windows::winreg_get,
        windows::winreg_set,
        windows::winreg_delete,
        get_this_binary,
        get_disk_stats
      ],
    )
    .build(tauri::generate_context!())
    .expect("error while running tauri application");
  app.run(|app_handle, e| match e {
    Event::CloseRequested { label, api, .. } => {
      let app_handle = app_handle.clone();
      let window = app_handle.get_window(&label).unwrap();
      // use the exposed close api, and prevent the event loop to close
      api.prevent_close(); // prevent the window from closing
      window.hide().unwrap(); // hide the window
      let tray_handle = app_handle.tray_handle().clone();
      let item_handle = tray_handle.get_item(&"toggle_visibility");
      item_handle.set_title("Show").unwrap(); // update the tray menu title to reflect the hidden state of the window
    }
    Event::ExitRequested { api, .. } => {
      api.prevent_exit();
    }
    _ => {}
  })
}
