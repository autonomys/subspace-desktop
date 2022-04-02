import {
  Dialog,
  DialogChainObject,
  LooseDictionary
} from "quasar"
import { Component } from "vue"
import * as process from "process"
import { appData } from "./appData"

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
  await appData.clearDataDir()
}
export interface AppConfig {
  [index: string]: any
  plot: Plot
  account: Account
  segmentCache: SegmentCache
  launchOnBoot: boolean
}

export interface SegmentCache {
  networkSegmentCount: number
  allocatedGB: number
}
export interface Account {
  farmerPublicKey: string
}
export interface Plot {
  location: string
}

export const emptyAppConfig: AppConfig = {
  plot: { location: "" },
  account: { farmerPublicKey: "" },
  segmentCache: { networkSegmentCount: 0, allocatedGB: 0 },
  launchOnBoot: true
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
