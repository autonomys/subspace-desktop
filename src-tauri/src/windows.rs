use winreg::{enums::HKEY_CURRENT_USER, RegKey};

//TODO Refactor into special case functions instead of general utility functions
#[tauri::command]
pub fn winreg_get(sub_key: String, value: String) -> String {
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
            eprintln!("There was an error: {}", error);
            result = error.to_string();
        }
    }
    return result;
}

#[tauri::command]
pub fn winreg_set(sub_key: String, set_key: String, value: String) -> String {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    // let subkey = hkcu.open_subkey(sub_key).unwrap();
    let (subkey, _disp) = hkcu.create_subkey(&sub_key).unwrap();

    let val = subkey.set_value(set_key, &value);
    let mut result: String = "success".to_string();
    match val {
        Ok(()) => {}
        Err(error) => {
            eprintln!("There was an error: {}", error);
            result = error.to_string();
        }
    }
    return result;
}

#[tauri::command]
pub fn winreg_delete(sub_key: String, set_key: String) -> String {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let (subkey, _disp) = hkcu.create_subkey(&sub_key).unwrap();
    let val = subkey.delete_value(set_key);
    let mut result: String = "success".to_string();
    match val {
        Ok(()) => {}
        Err(error) => {
            eprintln!("There was an error: {}", error);
            result = error.to_string();
        }
    }
    return result;
}
