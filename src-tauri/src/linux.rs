use crate::utils::get_this_binary;
use std::{fs, path::PathBuf};

#[tauri::command]
pub(crate) fn create_linux_auto_launch_file(hidden: &str) -> Result<(), String> {
    let ctx = tauri::generate_context!(); // context is necessary to get bundle id
    let id = &ctx.config().tauri.bundle.identifier;

    let path = linux_auto_launch_dir();
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
pub(crate) fn linux_auto_launch_file_exist() -> bool {
    let path = linux_auto_launch_dir();
    fs::read(path).is_ok()
}

#[tauri::command]
pub(crate) fn remove_linux_auto_launch_file() -> Result<(), String> {
    let path = linux_auto_launch_dir();

    match fs::remove_file(path) {
        Ok(_) => Ok(()),
        Err(why) => Err(format!("couldn't remove file because: {why}")),
    }
}

fn linux_auto_launch_dir() -> PathBuf {
    let ctx = tauri::generate_context!(); // context is necessary to get bundle id
    let id = &ctx.config().tauri.bundle.identifier;

    crate::utils::config_dir()
        .join("autostart")
        .join(format!("{id}.desktop"))
}
