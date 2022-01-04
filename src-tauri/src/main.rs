#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

#[cfg(target_os = "windows")]
mod windows;

use anyhow::{anyhow, Result};
use jsonrpsee::ws_server::WsServerBuilder;
use log::info;
use serde::Serialize;
use std::{fs, net::SocketAddr, path::PathBuf};
use subspace_farmer::{
  ws_rpc_server::{RpcServer, RpcServerImpl},
  Commitments, Farming, Identity, ObjectMappings, Plot, Plotting, RpcClient, WsRpc,
};
use subspace_solving::SubspaceCodec;
use tauri::{
  api::{self},
  CustomMenuItem, Event, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
};

#[derive(Serialize)]
struct DiskStats {
  free_bytes: u64,
  total_bytes: u64,
}

#[tauri::command]
async fn farming() -> [u8; 32] {
  let path = get_path(None);
  let node_rpc_url: String = "ws://127.0.0.1:9944".to_string();
  let ws_server_listen_addr: SocketAddr = "127.0.0.1:9955".parse().unwrap();

  // start farming, and return the public key of the farmer
  let public_key = farm(path, &node_rpc_url, ws_server_listen_addr).await;
  public_key.unwrap()
}

#[tauri::command]
fn get_disk_stats(dir: String) -> DiskStats {
  println!("{}", dir.to_string());
  let free: u64 = fs2::available_space(&dir).expect("error");
  let total: u64 = fs2::total_space(&dir).expect("error");
  return DiskStats {
    free_bytes: free,
    total_bytes: total,
  };
}

#[tauri::command]
fn get_this_binary() -> PathBuf {
  let bin = api::process::current_binary();
  return bin.unwrap();
}

#[tokio::main]
async fn main() -> Result<()> {
  let quit = CustomMenuItem::new("quit".to_string(), "Quit");
  let toggle_visibility = CustomMenuItem::new("toggle_visibility".to_string(), "Hide");

  let tray_menu = SystemTrayMenu::new()
    .add_item(toggle_visibility)
    .add_native_item(SystemTrayMenuItem::Separator)
    .add_item(quit);
  let tray = SystemTray::new().with_menu(tray_menu);

  let app = tauri::Builder::default()
    .system_tray(tray)
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
              //#[cfg(target_os = "macos")]
              // app.set_activation_policy(tauri::ActivationPolicy::Accessory); // TODO This should hide the main taskbar icon when the window is hidden, however there is a borrow error

              item_handle.set_title("Show").unwrap();
            } else {
              window.show().unwrap();
              //#[cfg(target_os = "macos")]
              // app.set_activation_policy(tauri::ActivationPolicy::Regular); // TODO This should show the main taskbar icon when the window is visible, however there is a borrow error
              item_handle.set_title("Hide").unwrap();
            }
          }
          _ => {}
        }
      }
      _ => {}
    })
    .invoke_handler(
      #[cfg(not(target_os = "windows"))]
      tauri::generate_handler![get_disk_stats, get_this_binary, farming],
      #[cfg(target_os = "windows")]
      tauri::generate_handler![
        windows::winreg_get,
        windows::winreg_set,
        windows::winreg_delete,
        get_this_binary,
        get_disk_stats,
        farming,
      ],
    )
    .build(tauri::generate_context!())
    .expect("error while running tauri application");

  app.run(|app_handle, e| match e {
    Event::CloseRequested { label, api, .. } => {
      let app_handle = app_handle.clone();
      let window = app_handle.get_window(&label).unwrap();
      // use the exposed close api, and prevent the event loop to close
      api.prevent_close();
      // hide the window
      window.hide().unwrap();
      // TODO This should hide the main taskbar icon when the window is closed on macos, however there is a borrow error
      // #[cfg(target_os = "macos")]
      // app.set_activation_policy(tauri::ActivationPolicy::Accessory);
      let tray_handle = app_handle.tray_handle().clone();
      let item_handle = tray_handle.get_item(&"toggle_visibility");
      item_handle.set_title("Show").unwrap(); // update the tray menu title to reflect the hidden state of the window
    }
    Event::ExitRequested { api, .. } => {
      api.prevent_exit();
    }
    _ => {}
  });

  Ok(())
}

/// Start farming by using plot in specified path and connecting to WebSocket server at specified
/// address.
pub(crate) async fn farm(
  base_directory: PathBuf,
  node_rpc_url: &str,
  ws_server_listen_addr: SocketAddr,
) -> Result<[u8; 32], anyhow::Error> {
  // TODO: This doesn't account for the fact that node can
  // have a completely different history to what farmer expects
  info!("Opening plot");
  let plot_fut = tokio::task::spawn_blocking({
    let base_directory = base_directory.clone();

    move || Plot::open_or_create(&base_directory)
  });
  let plot = plot_fut.await.unwrap()?;

  info!("Opening commitments");
  let commitments_fut = tokio::task::spawn_blocking({
    let path = base_directory.join("commitments");

    move || Commitments::new(path)
  });
  let commitments = commitments_fut.await.unwrap()?;

  info!("Opening object mapping");
  let object_mappings = tokio::task::spawn_blocking({
    let base_directory = base_directory.clone();

    move || ObjectMappings::open_or_create(&base_directory)
  })
  .await??;

  info!("Connecting to node at {}", node_rpc_url);
  let client = WsRpc::new(node_rpc_url).await?;

  let farmer_metadata = client
    .farmer_metadata()
    .await
    .map_err(|error| anyhow::Error::msg(error.to_string()))?;

  let identity = Identity::open_or_create(&base_directory)?;

  let subspace_codec = SubspaceCodec::new(identity.public_key());

  // Start RPC server
  let ws_server = WsServerBuilder::default()
    .build(ws_server_listen_addr)
    .await?;
  let ws_server_addr = ws_server.local_addr()?;
  let rpc_server = RpcServerImpl::new(
    farmer_metadata.record_size,
    farmer_metadata.recorded_history_segment_size,
    plot.clone(),
    object_mappings.clone(),
    subspace_codec,
  );
  let _stop_handle = ws_server.start(rpc_server.into_rpc())?;

  info!("WS RPC server listening on {}", ws_server_addr);

  // start the farming task
  let farming_instance = Farming::start(
    plot.clone(),
    commitments.clone(),
    client.clone(),
    identity.clone(),
  );

  // start the background plotting
  let plotting_instance = Plotting::start(
    plot,
    commitments,
    object_mappings,
    client,
    farmer_metadata,
    subspace_codec,
  );

  // wait for the farming and plotting in the background
  tokio::spawn(async {
    tokio::select! {
      res = plotting_instance.wait() => if let Err(error) = res {
        return Err(anyhow!(error))
      },
      res = farming_instance.wait() => if let Err(error) = res {
        return Err(anyhow!(error))
      },
    }
    Ok(())
  });

  Ok(identity.public_key().to_bytes())
}

pub(crate) fn get_path(custom_path: Option<PathBuf>) -> PathBuf {
  // set storage path
  let path = custom_path
    .or_else(|| std::env::var("SUBSPACE_DIR").map(PathBuf::from).ok())
    .unwrap_or_else(|| {
      dirs::data_local_dir()
        .expect("Can't find local data directory, needs to be specified explicitly")
        .join("subspace")
    });

  if !path.exists() {
    fs::create_dir_all(&path)
      .unwrap_or_else(|error| panic!("Failed to create data directory {:?}: {:?}", path, error));
  }

  path
}
