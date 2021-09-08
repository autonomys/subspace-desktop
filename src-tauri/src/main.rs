#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]
use serde::Serialize;
use tauri::{
  CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
  WindowBuilder, WindowUrl,
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

fn main() {
  let quit = CustomMenuItem::new("quit".to_string(), "Quit");
  let hide = CustomMenuItem::new("hide".to_string(), "Hide");
  let show = CustomMenuItem::new("show".to_string(), "Show");

  let tray_menu = SystemTrayMenu::new()
    .add_item(quit)
    .add_native_item(SystemTrayMenuItem::Separator)
    .add_item(hide)
    .add_item(show);
  let tray = SystemTray::new().with_menu(tray_menu);

  tauri::Builder::default()
    .system_tray(tray)
    .on_system_tray_event(|app, event| match event {
      SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
        "quit" => {
          std::process::exit(0);
        }
        "hide" => {
          let window = app.get_window("main").unwrap();
          // window.close().unwrap();
          // window

          window.hide().unwrap();
        }
        "show" => {
          let window = app.get_window("main").unwrap();
          // window.create_window("label", "/").unwrap();
          // window.o
          window.show().unwrap();
          // window.create_window("main".to_string(), WindowUrl::default(), |win, webview| {
          //   let win = win
          //     .title("Test")
          //     .resizable(true)
          //     .transparent(false)
          //     .decorations(true)
          //     .always_on_top(false)
          //     .inner_size(800.0, 600.0)
          //     .min_inner_size(300.0, 150.0)
          //     .skip_taskbar(false)
          //     .fullscreen(false);
          //   return (win, webview);
          // });
        }
        _ => {}
      },
      _ => {}
    })
    .invoke_handler(tauri::generate_handler![get_disk_stats])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
