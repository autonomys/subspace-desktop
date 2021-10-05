#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

#[cfg(target_os = "windows")]
mod windows;

use serde::Serialize;
use std::path::PathBuf;
use tauri::{
  api, CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
  WindowEvent,
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
  let builder = tauri::Builder::default()
    .setup(|app| {
      let window = app.get_window("main").unwrap();

      // app.listen_global("window-closed", |data| {
      //   println!("{:?}", data.payload());
      //   let item_handle = app.tray_handle().get_item(&"toggle_visibility");
      // });

      window.on_window_event({
        let window = window.clone();
        move |event| match event {
          WindowEvent::CloseRequested => {
            println!("Close requested");
            window.trigger_global("window-closed", Some(String::from("hi")));
            // let item_handle = app.tray_handle().get_item(&"toggle_visibility");
            // window.hide().unwrap();
            // item_handle.set_title("Show").unwrap();
          }
          _ => {}
        }
      });
      Ok(())
    })
    .system_tray(tray)
    // .on_window_event(handler)
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
    .invoke_handler(tauri::generate_handler![get_disk_stats, get_this_binary]);

  #[cfg(target_os = "windows")]
  let builder = builder.invoke_handler(tauri::generate_handler![
    windows::winreg_get,
    windows::winreg_set,
    windows::winreg_delete,
    get_this_binary,
    get_disk_stats
  ]);

  builder
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
