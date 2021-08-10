#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]
use serde::Serialize;
// use std::ffi::OsStr;
// use std::path::Path;

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
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![get_disk_stats])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
