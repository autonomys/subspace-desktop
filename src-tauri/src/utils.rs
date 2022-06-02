use log::{debug, error, info};
use serde::Serialize;
use std::io::Write;
use std::path::PathBuf;
use tauri::{api, Env};
use tracing_subscriber::fmt::MakeWriter;

pub(crate) struct Tee<A, B>(pub A, pub B);

impl<A: Write, B: Write> Write for Tee<A, B> {
    fn write(&mut self, buf: &[u8]) -> std::io::Result<usize> {
        let a = self.0.write(buf)?;
        let b = self.1.write(buf)?;
        Ok(a.min(b))
    }

    fn flush(&mut self) -> std::io::Result<()> {
        self.0.flush()?;
        self.1.flush()?;
        Ok(())
    }
}

impl<'a, A: for<'b> MakeWriter<'a>, B: for<'b> MakeWriter<'a>> MakeWriter<'a> for Tee<A, B> {
    type Writer = Tee<<A as MakeWriter<'a>>::Writer, <B as MakeWriter<'a>>::Writer>;

    fn make_writer(&'a self) -> Self::Writer {
        Tee(self.0.make_writer(), self.1.make_writer())
    }
}

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
