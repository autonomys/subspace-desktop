use crate::utils::get_this_binary;
use std::{fs, path::PathBuf};

#[tauri::command]
pub(crate) fn create_linux_auto_launch_file(
    hidden: &str,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let id = &app_handle.config().tauri.bundle.identifier;

    let path = linux_auto_launch_dir(app_handle);
    let app_path = get_this_binary().to_str().unwrap().to_string();
    let contents = format!(
        "[Desktop Entry]
        Type=Application
        Name={id}
        Comment={id} startup script
        Exec={app_path}{hidden}
        Icon={id}"
    );

    match fs::write(path, contents) {
        Ok(_) => Ok(()),
        Err(why) => Err(format!("couldn't write file because: {why}")),
    }
}

#[tauri::command]
pub(crate) fn linux_auto_launch_file_exist(app_handle: tauri::AppHandle) -> bool {
    let path = linux_auto_launch_dir(app_handle);
    fs::read(path).is_ok()
}

#[tauri::command]
pub(crate) fn remove_linux_auto_launch_file(app_handle: tauri::AppHandle) -> Result<(), String> {
    let path = linux_auto_launch_dir(app_handle);

    match fs::remove_file(path) {
        Ok(_) => Ok(()),
        Err(why) => Err(format!("couldn't remove file because: {why}")),
    }
}

fn linux_auto_launch_dir(app_handle: tauri::AppHandle) -> PathBuf {
    let id = &app_handle.config().tauri.bundle.identifier;

    crate::utils::config_dir(app_handle)
        .join("autostart")
        .join(format!("{id}.desktop"))
}
