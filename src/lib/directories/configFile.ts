import { Dialog, DialogChainObject } from "quasar"
import * as dialog from "@tauri-apps/api/dialog"
import * as fs from "@tauri-apps/api/fs"
import * as path from "@tauri-apps/api/path"
import { invoke } from "@tauri-apps/api/tauri"
import * as process from "process"
import { ConfigFile, emptyConfig } from "../util"

const tauri = { dialog, fs, path, invoke }

export const dirName = process.env.DEFAULT_APP_DIR || ".subspace-desktop"

/**  
  Linux: Resolves to $XDG_CONFIG_HOME or $HOME/.config.
  macOS: Resolves to $HOME/Library/Application Support.
  Windows: Resolves to {FOLDERID_LocalAppData}.
 */
export const configFile = {
  async getConfigFile(): Promise<ConfigFile | void> {
    const configDir = (await tauri.path.configDir()) + dirName
    const result = await tauri.fs
      .readTextFile(configDir + "/config.json")
      .catch(console.error)
    if (result) return JSON.parse(result)
  },
  async updateConfigFile(newData: ConfigFile): Promise<void> {
    const configFile = (await this.getConfigFile()) || emptyConfig
    for (const [key, value] of Object.entries(newData)) {
      Object.assign(configFile[key], value)
    }
    await this.writeConfigFile(configFile)
  },
  async writeConfigFile(config: ConfigFile): Promise<void> {
    const configDir = (await tauri.path.configDir()) + dirName
    await tauri.fs
      .writeFile({
        path: configDir + "/config.json",
        contents: JSON.stringify(config, null, 2)
      })
      .catch(console.error)
  },
  async initConfigFile(): Promise<void> {
    const configDir = (await tauri.path.configDir()) + dirName
    await tauri.fs.createDir(configDir).catch(console.error)
    await this.writeConfigFile(emptyConfig)
  },
  async clearConfigDir(): Promise<void> {
    const configDir = (await tauri.path.configDir()) + dirName
    await tauri.fs
      .removeDir(configDir, { recursive: true })
      .catch(console.error)
  },
  showErrorModal(): DialogChainObject {
    return Dialog.create({ message: "Config file is corrupted, resetting..." })
  }
}
