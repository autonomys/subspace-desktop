// tauri related utils have to be in the separate module, otherwise unit tests will fail:
// tauri api requires access to global navigator, which is limited within tests
import { invoke } from "@tauri-apps/api/tauri"
import { appData } from "../appData"
import { config } from "../appConfig"
import { LocalStorage } from "quasar"

export const appName: string = process.env.APP_NAME || "subspace-desktop";

export async function getLogPath(): Promise<string> {
  return await invoke("custom_log_dir", { id: appName })
}

export async function errorLogger(error: unknown): Promise<void> {
  if (error instanceof Error) {
    const message = error.message
    await invoke("frontend_error_logger", { message })
  } else if (typeof error === "string") {
    await invoke("frontend_error_logger", { message: error })
  }
}

export async function infoLogger(info: unknown): Promise<void> {
  if (info instanceof Error) {
    const message = info.message
    await invoke("frontend_info_logger", { message })
  } else if (typeof info === "string") {
    await invoke("frontend_info_logger", { message: info })
  }
}

export async function resetAndClear(): Promise<void> {
  await LocalStorage.clear()
  await appData.clearDataDir()
  await config.remove()
}
