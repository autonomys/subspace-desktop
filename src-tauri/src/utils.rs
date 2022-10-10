use serde::Serialize;
use std::fs;
use std::fs::File;
use std::io::prelude::*;
use std::path::PathBuf;
use std::process::Command;
use tauri::{api, Env};
use tracing::{debug, error, info};

#[cfg(not(target_os = "windows"))]
use std::os::unix::fs::PermissionsExt;

#[derive(Serialize)]
pub(crate) struct DiskStats {
    free_bytes: u64,
    total_bytes: u64,
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
pub(crate) fn open_log_dir() {
    let path = custom_log_dir();

    #[cfg(target_os = "windows")]
    Command::new("explorer")
        .arg(path)
        .spawn()
        .expect("could not open the specified directory");

    #[cfg(target_os = "macos")]
    Command::new("open")
        .arg(path)
        .spawn()
        .expect("could not open the specified directory");

    #[cfg(target_os = "linux")]
    Command::new("xdg-open")
        .arg(path)
        .spawn()
        .expect("could not open the specified directory");
}

#[tauri::command]
pub(crate) fn write_config(content: String) -> Result<(), String> {
    let path = config_dir();

    match File::create(path) {
        Ok(mut file) => {
            file.write_all(content.as_bytes())
                .expect("couldn't write file");

            // config file is created under the current user's folder, in Windows, other users do not have read/write access to these
            #[cfg(not(target_os = "windows"))]
            {
                let mut perms = file
                    .metadata()
                    .expect("could not get metadata")
                    .permissions();
                perms.set_mode(0o600);

                file.set_permissions(perms)
                    .expect("failed to set permissions for the config");
            }
            Ok(())
        }
        Err(why) => Err(format!("couldn't create config because: {why}")),
    }
}

#[tauri::command]
pub(crate) fn read_config() -> Result<String, String> {
    let path = config_dir();

    match fs::read_to_string(path) {
        Ok(content) => Ok(content),
        Err(why) => Err(format!("couldn't read file because: {why}")),
    }
}

#[tauri::command]
pub(crate) fn remove_config() -> Result<(), String> {
    let path = config_dir();

    match fs::remove_file(path) {
        Ok(_) => Ok(()),
        Err(why) => Err(format!("couldn't remove file because: {why}")),
    }
}

#[tauri::command]
pub(crate) fn create_dir(path: &str) -> Result<(), String> {
    match fs::create_dir(path) {
        Ok(_) => Ok(()),
        Err(why) => Err(format!("couldn't create directory because: {why}")),
    }
}

#[tauri::command]
pub(crate) fn remove_dir(path: &str) -> Result<(), String> {
    let ctx = tauri::generate_context!(); // context is necessary to get bundle id
    let id = &ctx.config().tauri.bundle.identifier;
    let config_name = format!("{id}.cfg");
    let white_list = vec!["plots", &config_name]; // files that we created

    let result = fs::read_dir(path).map(|dir| {
        dir.filter_map(|res_entry| res_entry.ok())
            .all(|entry| white_list.contains(&entry.file_name().to_str().unwrap()))
    });

    match result {
        Ok(res) => {
            if res {
                match fs::remove_dir_all(path) {
                    Ok(_) => Ok(()),
                    Err(why) => Err(format!("couldn't remove directory because: {why}")),
                }
            } else {
                Err(format!("there are unrecognized files in the directory: {path}. Aborting the operation for security reasons."))
            }
        }
        Err(_) => Err(format!("couldn't read the directory to be removed")),
    }
}

/// returns how many entries there are in the directory
/// if there is an error reading the directory (directory does not exist), returns -1
#[tauri::command]
pub(crate) fn entry_count_directory(path: &str) -> isize {
    match fs::read_dir(path) {
        Ok(dir) => dir.count() as isize,
        Err(_) => -1,
    }
}

pub(crate) fn custom_log_dir() -> PathBuf {
    let ctx = tauri::generate_context!(); // context is necessary to get bundle id
    let id = &ctx.config().tauri.bundle.identifier;

    #[cfg(target_os = "macos")]
    let path = dirs::home_dir().map(|dir| dir.join("Library/Logs").join(id));
    // evaluates to: `~/Library/Logs/${bundle_name}/

    #[cfg(target_os = "linux")]
    let path = dirs::data_local_dir().map(|dir| dir.join(id).join("logs"));
    // evaluates to: `~/.local/share/${bundle_name}/logs/

    #[cfg(target_os = "windows")]
    let path = dirs::data_local_dir().map(|dir| dir.join(id).join("logs"));
    // evaluates to: `C:/Users/Username/AppData/Local/${bundle_name}/logs/

    path.expect("Could not resolve custom log directory path!")
}

pub(crate) fn config_dir() -> PathBuf {
    let ctx = tauri::generate_context!(); // context is necessary to get bundle id
    let id = &ctx.config().tauri.bundle.identifier;

    let config_dir = dirs::config_dir();
    // * - **Linux:** Resolves to `$XDG_CONFIG_HOME` or `$HOME/.config`.
    // * - **macOS:** Resolves to `$HOME/Library/Application Support`.
    // * - **Windows:** Resolves to `{FOLDERID_RoamingAppData}`.

    config_dir
        .map(|dir| dir.join(id).join(format!("{id}.cfg")))
        .expect("cannot resolve config directory")
}
