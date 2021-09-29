#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]
use std::path::PathBuf;

use serde::Serialize;
use tauri::{
  api, generate_handler, CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu,
  SystemTrayMenuItem, WindowEvent,
};

#[cfg(target_os = "windows")]
extern crate winreg;

#[cfg(target_os = "windows")]
use {winreg::enums::*, winreg::RegKey};

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
}
#[cfg(target_os = "windows")]
#[tauri::command]
fn winreg_get(sub_key: String, value: String) -> String {
  let hkcu = RegKey::predef(HKEY_CURRENT_USER);
  let subkey = hkcu.open_subkey(sub_key).unwrap();
  let val = subkey.get_value(value);
  let result: String;
  match val {
    Ok(content) => {
      println!("File content: {}", content);
      result = content;
    }
    Err(error) => {
      println!("There was an error: {}", error);
      result = error.to_string();
    }
  }

  return result;
}

#[cfg(target_os = "windows")]
#[tauri::command]
fn winreg_set(sub_key: String, set_key: String, value: String) -> String {
  let hkcu = RegKey::predef(HKEY_CURRENT_USER);
  // let subkey = hkcu.open_subkey(sub_key).unwrap();
  let (subkey, disp) = hkcu.create_subkey(&sub_key).unwrap();
  match disp {
    REG_CREATED_NEW_KEY => println!("A new key has been created"),
    REG_OPENED_EXISTING_KEY => println!("An existing key has been opened"),
  }
  let val = subkey.set_value(set_key, &value);
  let mut result: String = "success".to_string();
  match val {
    Ok(()) => {}
    Err(error) => {
      println!("There was an error: {}", error);
      result = error.to_string();
    }
  }
  return result;
}

#[cfg(target_os = "windows")]
#[tauri::command]
fn winreg_delete(sub_key: String, set_key: String) -> String {
  let hkcu = RegKey::predef(HKEY_CURRENT_USER);
  let (subkey, disp) = hkcu.create_subkey(&sub_key).unwrap();
  match disp {
    REG_CREATED_NEW_KEY => println!("A new key has been created"),
    REG_OPENED_EXISTING_KEY => println!("An existing key has been opened"),
  }
  let val = subkey.delete_value(set_key);
  let mut result: String = "success".to_string();
  match val {
    Ok(()) => {}
    Err(error) => {
      println!("There was an error: {}", error);
      result = error.to_string();
    }
  }
  return result;
}

fn main() {
  let handlers: () = match cfg!(target_os = "windows") {
    true => tauri::generate_handler![
      get_disk_stats,
      get_this_binary,
      winreg_get,
      winreg_set,
      winreg_delete,
    ],
    false => tauri::generate_handler![get_disk_stats, get_this_binary],
  };

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
    .invoke_handler(handlers())
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
