import * as dialog from "@tauri-apps/api/dialog"
import * as fs from "@tauri-apps/api/fs"
import * as path from "@tauri-apps/api/path"
import { invoke } from "@tauri-apps/api/tauri"
import * as native from "../native"
import { configFile } from "./configFile"

const tauri = { dialog, fs, path, invoke }

export const appDir = {
  async getDataDirPath(): Promise<string | void> {
    const config = await configFile.getConfigFile()
    if (config) return config.plot.location
  },
  async saveDataDirPath(location: string): Promise<void> {
    const config = await configFile.getConfigFile()
    if (config) {
      await config.updateConfigFile({
        ...configFile,
        plot: {
          location
        }
      })
    }
  },
  async clearDataDir(): Promise<void> {
    const dataDir = await this.getDataDirPath()
    if (!dataDir) return
    await tauri.fs.removeDir(dataDir, { recursive: true }).catch(console.error)
  },
  async createCustomDataDir(location: string): Promise<void> {
    await native.createDir(location).catch(console.error)
  }
}
