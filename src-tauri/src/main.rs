#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use std::path::PathBuf;

use serde::Serialize;
use tauri::{
  api, CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
  WindowEvent,
};

// use tauri::{api, CustomMenuItem, Menu, MenuItem, Submenu, WindowBuilder, WindowUrl};

#[derive(Serialize)]
struct S {
  free_bytes: u64,
  total_bytes: u64,
}

#[tauri::command]
fn get_disk_stats(dir: String) -> S {
  println!("{}", dir.to_string());
  let free: u64 = fs2::available_space(&dir).expect("error");
  let total: u64 = fs2::total_space(&dir).expect("error");
  return S {
    free_bytes: free,
    total_bytes: total,
  };
}

#[tauri::command]
fn get_this_binary() -> PathBuf {
  let bin = api::process::current_binary();
  return bin.unwrap();
  // println!("{}", dir.to_string());
  // let free: u64 = fs2::available_space(&dir).expect("error");
  // let total: u64 = fs2::total_space(&dir).expect("error");
  // return S {
  //   free_bytes: free,
  //   total_bytes: total,
  // };
}

fn main() {
  let quit = CustomMenuItem::new("quit".to_string(), "Quit");
  let toggle_visibility = CustomMenuItem::new("toggle_visibility".to_string(), "Hide");

  let tray_menu = SystemTrayMenu::new()
    .add_item(toggle_visibility)
    .add_native_item(SystemTrayMenuItem::Separator)
    .add_item(quit);
  let tray = SystemTray::new().with_menu(tray_menu);
  tauri::Builder::default()
    .setup(|app| {
      let window = app.get_window("main").unwrap();
      window.on_window_event({
        let window = window.clone();

        move |event| match event {
          WindowEvent::CloseRequested => {
            println!("Close requested");
            window.trigger_global("window-closed", Some(String::from("hi"))); // this causes a problem
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
    .invoke_handler(tauri::generate_handler![get_disk_stats, get_this_binary])
    // .invoke_handler(tauri::generate_handler![get_this_binary])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
