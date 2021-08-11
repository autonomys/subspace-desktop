import introModal from "components/introModal.vue"
import { Dialog, DialogChainObject } from "quasar"

import * as global from "src/lib/global"
import * as dialog from "@tauri-apps/api/dialog"
import * as fs from "@tauri-apps/api/fs"
import * as path from "@tauri-apps/api/path"
import { invoke } from '@tauri-apps/api/tauri'

const tauri = { dialog, fs, path, invoke }

const modalComponents: { [index: string]: any } = {
  introModal
}
export const random = (min, max) => Math.floor(Math.random() * (max - min)) + min;

interface propsType {
  [index: string]: any
}
export async function showModal(componentName: string, props: propsType = {}): Promise<DialogChainObject | null> {
  console.log("Show Modal")
  return Dialog.create({
    message: "Testing",
    component: modalComponents[componentName],
    componentProps: {
      ...props,
    },
  })
}

export function toFixed(num: number, precision: number) {
  return parseFloat(num.toFixed(precision))
}

export function plotTimeMsEstimate(gb: number): number {
  return gb * 5e4
}

export interface ConfigFile {
  plot: { sizeGB: number, location: string }
}
export const config = {
  async read(dir?: string): Promise<ConfigFile> {
    if (!dir) dir = (await tauri.path.homeDir()) + ".subspace-farmer-demo"
    await native.createDir(dir)
    const result = await tauri.fs.readTextFile(dir + "/config.json")
    const config: ConfigFile = JSON.parse(result)
    return config
  },
  async write(dir: string = "", config: ConfigFile) {
    if (dir == "") dir = (await tauri.path.homeDir()) + ".subspace-farmer-demo"
    await native.createDir(dir)
    await tauri.fs.writeFile({ path: dir + "/config.json", contents: JSON.stringify(config, null, 2) })
  }
}

export interface DriveStats {
  freeBytes: number,
  totalBytes: number
}

export function formatMS(duration: number) {
  duration /= 1000
  // Hours, minutes and seconds
  var hrs = ~~(duration / 3600)
  var mins = ~~((duration % 3600) / 60)
  var secs = ~~duration % 60

  // Output like "1:01" or "4:03:59" or "123:03:59"
  var ret = ""

  if (hrs > 0) {
    ret += "" + hrs + ":" + (mins < 10 ? "0" : "")
  }

  ret += "" + mins + ":" + (secs < 10 ? "0" : "")
  ret += "" + secs
  return ret
}

export const native = {
  async createDir(path: string) {
    const result = await tauri.fs.createDir(path).catch(console.error)
    return result
  },
  async selectDir(defaultPath: undefined | string): Promise<string | null> {
    let exists: boolean = false
    if (defaultPath) exists = await this.dirExists(defaultPath)
    if (!exists) defaultPath = undefined
    const result = (await tauri.dialog.open({ directory: true, defaultPath })) as null | string
    return result
  },
  async dirExists(dir: string): Promise<boolean> {
    return (await tauri.fs.readDir(dir, { recursive: false }).catch(console.error)) ? true : false
  },
  async driveStats(dir: string): Promise<DriveStats> {
    const result = await tauri.invoke('get_disk_stats', { dir }) as any
    const stats: DriveStats = { freeBytes: result.free_bytes, totalBytes: result.total_bytes }
    return stats
  }
}