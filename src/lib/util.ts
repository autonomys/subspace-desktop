import {
  Dialog,
  DialogChainObject,
  LocalStorage,
  LooseDictionary
} from "quasar"
import { Component } from "vue"
import * as bcrypt from "bcryptjs"
import * as process from "process"
import { appDir } from "./directories/appDir"
import { configFile } from "./directories/configFile"

export const dirName = process.env.DEFAULT_APP_DIR || "subspace-desktop"

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

export async function resetAndClear(): Promise<void> {
  try {
    await appDir.clearDataDir()
    await configFile.clearConfigDir()
    LocalStorage.clear()
  } catch (error) {
    console.error(error)
  }
}
export interface ConfigFile {
  [index: string]: any
  plot: Plot
  account: Account
  segmentCache: SegmentCache
}

export interface SegmentCache {
  lastNetSegmentIndex: number
  allocatedGB: number
}
export interface Account {
  farmerPublicKey: string
  passHash: string
}
export interface Plot {
  location: string
}

export const emptyConfig: ConfigFile = {
  plot: { location: "" },
  account: { farmerPublicKey: "", passHash: "" },
  segmentCache: { lastNetSegmentIndex: 0, allocatedGB: 0 }
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
export const CONTEXT_MENU = process.env.CONTEXT_MENU || "OFF"
