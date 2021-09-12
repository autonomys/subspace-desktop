import { Dialog, DialogChainObject } from "quasar"

import * as global from "src/lib/global"
import * as dialog from "@tauri-apps/api/dialog"
import * as fs from "@tauri-apps/api/fs"
import * as path from "@tauri-apps/api/path"
import { invoke } from '@tauri-apps/api/tauri'
const tauri = { dialog, fs, path, invoke }
import * as native from './native'

import * as bcrypt from 'bcryptjs'

export const random = (min, max) => Math.floor(Math.random() * (max - min)) + min;
interface propsType {
  [index: string]: any
}
export async function showModal(component: any, props: propsType = {}): Promise<DialogChainObject | null> {
  console.log("Show Modal")
  return Dialog.create({
    message: "Testing",
    component,
    componentProps: {
      ...props,
    },
  })
}

export function toFixed(num: number, precision: number) {
  if (!num) return 0
  return parseFloat(num.toFixed(precision))
}

export function plotTimeMsEstimate(gb: number): number {
  return gb * 5e4
}

export async function reset() {
  try {
    const configData = await config.read()
    if (configData?.plot?.location) await tauri.fs.removeFile(configData.plot.location).catch(console.error)
  } catch (error) {
    console.error(error)
  }

  config.clear()
}

export interface ConfigFile {
  plot?: { sizeGB?: number, location?: string }, account?: { pubkey?: string, passHash?: string }
}
const emptyConfig: ConfigFile = { plot: { sizeGB: 0, location: "" }, account: { pubkey: "", passHash: "" } }
export const config = {
  validate(config: ConfigFile): boolean {
    const acctValid = config.account ? true : false
    const plotValid = config.plot ? true : false
    // console.log('acctValid', acctValid);
    // console.log('plotValid', acctValid);
    return (acctValid && plotValid)
  },
  async read(dir?: string): Promise<ConfigFile> {
    if (!dir) dir = (await tauri.path.homeDir()) + ".subspace-farmer-demo"
    const result = await tauri.fs.readTextFile(dir + "/config.json")
    const config: ConfigFile = JSON.parse(result)
    return config
  },
  async write(dir: string = "", config: ConfigFile) {
    if (dir == "") dir = (await tauri.path.homeDir()) + ".subspace-farmer-demo"
    await native.createDir(dir).catch(console.error)
    await tauri.fs.writeFile({ path: dir + "/config.json", contents: JSON.stringify(config, null, 2) })
  },
  async clear(dir?: string) {
    if (!dir) dir = (await tauri.path.homeDir()) + ".subspace-farmer-demo"
    await tauri.fs.removeFile(dir + "/config.json").catch(console.error)
  },
  async update(newData: ConfigFile, dir?: string) {
    let config = await this.read(dir).catch(console.error) || emptyConfig
    for (const [key, value] of Object.entries(newData)) {
      config[key] = Object.assign(config[key], value)
    }
    await this.write(dir, config)
  },
  showErrorModal() {
    return Dialog.create({ message: "Config file is corrupted, resetting..." })
  }
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


export const password = {
  encrypt(pass: string): string {
    const salt = bcrypt.genSaltSync(10)
    const hash = bcrypt.hashSync(pass, salt)
    return hash
  }, check(pass: string, hash) {
    return bcrypt.compareSync(pass, hash); // true
  }
}