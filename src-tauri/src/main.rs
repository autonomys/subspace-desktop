#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

#[tauri::command]
fn get_disk_stats(dir: String) -> String {
  // const file: u64 = fs2::free_space(dir).expect("error"); // need to return data from fs2
  println!("I was invoked from JS!");
  return "testing".to_string();
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![get_disk_stats])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
