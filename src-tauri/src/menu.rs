// FOR MACOS

use tauri::{
    CustomMenuItem, Menu, MenuItem, Submenu, SystemTray, SystemTrayMenu, SystemTrayMenuItem,
};

pub fn get_tray_menu() -> SystemTray {
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let toggle_visibility = CustomMenuItem::new("toggle_visibility".to_string(), "Hide");
    let tray_menu = SystemTrayMenu::new()
        .add_item(toggle_visibility)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(quit);

    SystemTray::new().with_menu(tray_menu)
}

pub fn get_menu() -> Menu {
    let my_app_menu = Menu::new()
        .add_native_item(MenuItem::Services)
        .add_native_item(MenuItem::Separator)
        .add_native_item(MenuItem::Hide)
        .add_native_item(MenuItem::Separator)
        .add_native_item(MenuItem::Quit)
        .add_native_item(MenuItem::Separator);

    let edit_menu = Menu::new()
        .add_native_item(MenuItem::Undo)
        .add_native_item(MenuItem::Redo)
        .add_native_item(MenuItem::Separator)
        .add_native_item(MenuItem::Cut)
        .add_native_item(MenuItem::Copy)
        .add_native_item(MenuItem::Paste)
        .add_native_item(MenuItem::SelectAll);

    let window_menu = Menu::new()
        .add_native_item(MenuItem::Minimize)
        .add_native_item(MenuItem::CloseWindow);

    // add all our childs to the menu (order is how they'll appear)
    Menu::new()
        .add_submenu(Submenu::new("Subspace Desktop", my_app_menu))
        .add_submenu(Submenu::new("Edit", edit_menu))
        .add_submenu(Submenu::new("Window", window_menu))
}
