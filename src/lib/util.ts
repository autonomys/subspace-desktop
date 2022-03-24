import {
  Dialog,
  DialogChainObject,
  LocalStorage,
  LooseDictionary
} from "quasar"
import { Component } from "vue"
import * as dialog from "@tauri-apps/api/dialog"
import * as fs from "@tauri-apps/api/fs"
import * as path from "@tauri-apps/api/path"
import { invoke } from "@tauri-apps/api/tauri"
import * as native from "./native"
import * as bcrypt from "bcryptjs"
import * as process from "process"

const tauri = { dialog, fs, path, invoke }

export const dirName = process.env.DEFAULT_APP_DIR || ".subspace-desktop-farmer"

export const random = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min)) + min

export async function showModal(
  component: Component,
  props: LooseDictionary = {}
): Promise<DialogChainObject | null> {
  console.log("Show Modal")
  return Dialog.create({
    message: "Testing",
    component,
    componentProps: {
      ...props
    }
  })
}

export function toFixed(num: number, precision: number): number {
  if (!num) return 0
  return parseFloat(num.toFixed(precision))
}

export function plotTimeMsEstimate(gb: number): number {
  return gb * 5e4
}

export async function getAppDir(): Promise<string> {
  const appDir = LocalStorage.getItem("appDir")?.toString()
  if (appDir) return appDir
  return (await tauri.path.homeDir()) + dirName
}

export async function reset(dir?: string): Promise<void> {
  try {
    const { plot } = await config.read(dir)
    if (plot?.location) await config.clear(plot.location)
    else {
      await config.clear()
    }
    LocalStorage.clear()
  } catch (error) {
    console.error(error)
  }
}

export interface ConfigFile {
  [index: string]: any
  plot: { location: string; nodeLocation: string }
  account: { farmerPublicKey: string; passHash: string }
  utilCache: { lastNetSegmentIndex: number; allocatedGB: number }
}
const emptyConfig: ConfigFile = {
  plot: { location: "", nodeLocation: "" },
  account: { farmerPublicKey: "", passHash: "" },
  utilCache: { lastNetSegmentIndex: 0, allocatedGB: 0 }
}
export const config = {
  validate(config: ConfigFile): boolean {
    const { plot, account } = config
    if (
      plot.location.length > 0 &&
      plot.nodeLocation.length > 0 &&
      account.passHash.length > 0 &&
      account.farmerPublicKey.length > 0
    ) {
      return true
    }
    return false
  },
  async read(dir?: string): Promise<ConfigFile> {
    if (!dir) dir = (await tauri.path.homeDir()) + dirName
    const result = await tauri.fs.readTextFile(dir + "/config.json")
    const config: ConfigFile = JSON.parse(result)
    return config
  },
  async write(dir: string = "", config: ConfigFile): Promise<void> {
    if (dir == "") dir = (await tauri.path.homeDir()) + dirName
    await native.createDir(dir).catch(console.error)
    await tauri.fs
      .writeFile({
        path: dir + "/config.json",
        contents: JSON.stringify(config, null, 2)
      })
      .catch(console.error)
  },
  async clear(dir?: string): Promise<void> {
    if (!dir) dir = (await tauri.path.homeDir()) + dirName
    await tauri.fs.removeDir(dir, { recursive: true }).catch(console.error)
  },
  async update(newData: ConfigFile, dir?: string): Promise<void> {
    const config = (await this.read(dir).catch(console.error)) || emptyConfig
    for (const [key, value] of Object.entries(newData)) {
      Object.assign(config[key], value)
    }
    await this.write(dir, config)
  },
  async writeEmpty(): Promise<void> {
    const dir = (await tauri.path.homeDir()) + dirName
    await native.createDir(dir).catch(console.error)
    await tauri.fs
      .writeFile({
        path: dir + "/config.json",
        contents: JSON.stringify(emptyConfig, null, 2)
      })
      .catch(console.error)
  },
  async moveToSelectedDir(defaultDir: string, newDir: string): Promise<void> {
    const config = await this.read(defaultDir).catch(console.error)
    await native.createDir(newDir).catch(console.error)
    await tauri.fs
      .writeFile({
        path: newDir + "/config.json",
        contents: JSON.stringify(config, null, 2)
      })
      .catch(console.error)

    await tauri.fs
      .removeDir(defaultDir, { recursive: true })
      .catch(console.error)
  },
  showErrorModal(): DialogChainObject {
    return Dialog.create({ message: "Config file is corrupted, resetting..." })
  }
}

export function formatMS(duration: number): string {
  duration /= 1000
  // Hours, minutes and seconds
  const hrs = ~~(duration / 3600)
  const mins = ~~((duration % 3600) / 60)
  const secs = ~~duration % 60

  // Output like "1:01" or "4:03:59" or "123:03:59"
  let ret = ""

  if (hrs > 0) {
    ret += "" + hrs + ":" + (mins < 10 ? "0" : "")
  }

  ret += "" + mins + ":" + (secs < 10 ? "0" : "")
  ret += "" + secs
  return ret
}

export const password = {
  encrypt(pass: string): string {
    const salt = bcrypt.genSaltSync(10)
    const hash = bcrypt.hashSync(pass, salt)
    return hash
  },
  check(pass: string, hash: string): boolean {
    return bcrypt.compareSync(pass, hash) // true
  }
}

export const apiTypes = {
  Solution: {
    public_key: "AccountId32"
  },
  SubPreDigest: {
    slot: "u64",
    solution: "Solution"
  }
}

export const PIECE_SIZE = 4096
export const GB = 1024 * 1024 * 1024
export const CONTEXT_MENU = process.env.DEV || "OFF" // enables context menu only if DEV mode is on
