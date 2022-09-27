use serde::Serialize;
use std::path::PathBuf;
use std::process::Command;
use tauri::{api, Env};
use tracing::{debug, error, info};

#[derive(Serialize)]
pub(crate) struct DiskStats {
    free_bytes: u64,
    total_bytes: u64,
}

#[tauri::command]
pub(crate) fn open_folder(dir: String) {
    #[cfg(target_os = "windows")]
    Command::new("explorer")
        .arg(dir)
        .spawn()
        .expect("could not open the specified directory");

    #[cfg(target_os = "macos")]
    Command::new("open")
        .arg(dir)
        .spawn()
        .expect("could not open the specified directory");

    #[cfg(target_os = "linux")]
    Command::new("xdg-open")
        .arg(dir)
        .spawn()
        .expect("could not open the specified directory");
}

#[tauri::command]
pub(crate) fn get_disk_stats(dir: String) -> DiskStats {
    debug!("{}", dir);
    let free: u64 = fs2::available_space(&dir).expect("error");
    let total: u64 = fs2::total_space(&dir).expect("error");

    DiskStats {
        free_bytes: free,
        total_bytes: total,
    }
}

#[tauri::command]
pub(crate) fn get_this_binary() -> PathBuf {
    let bin = api::process::current_binary(&Env::default());
    bin.unwrap()
}

#[tauri::command]
pub(crate) fn frontend_error_logger(message: &str) {
    error!("Frontend error: {message}");
}

#[tauri::command]
pub(crate) fn frontend_info_logger(message: &str) {
    info!("Frontend info: {message}");
}

#[tauri::command]
pub(crate) fn custom_log_dir(id: &str) -> PathBuf {
    #[cfg(target_os = "macos")]
    let path = dirs::home_dir().map(|dir| {
        dir.join("Library/Logs").join(id)
        // evaluates to: `~/Library/Logs/${bundle_name}/
    });

    #[cfg(target_os = "linux")]
    let path = dirs::data_local_dir().map(|dir| dir.join(id).join("logs"));
    // evaluates to: `~/.local/share/${bundle_name}/logs/

    #[cfg(target_os = "windows")]
    let path = dirs::data_local_dir().map(|dir| dir.join(id).join("logs"));
    // evaluates to: `C:/Users/Username/AppData/Local/${bundle_name}/logs/

    path.expect("log path generation should succeed")
}
