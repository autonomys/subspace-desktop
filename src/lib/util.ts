import {
  Dialog,
  DialogChainObject,
} from "quasar"
import { Component } from "vue"
import * as process from "process"
import { invoke } from "@tauri-apps/api/tauri"
import { ApiPromise, WsProvider } from "@polkadot/api"
import { appData } from "./appData"
import { appConfig } from "./appConfig"
import { generateSlug } from "random-word-slugs"

const nodeNameMaxLength = 64
export const appName: string = process.env.APP_NAME || "subspace-desktop"

export const random = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min)) + min

export async function showModal(
  component: Component,
  props: any = {}
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

export function toFixed(num: number, precision: number): number {
  if (!num) return 0
  // don't remove `Number` cast, it is required. Thanks TypeScript!
  return parseFloat(Number(num).toFixed(precision))
}

export function plotTimeMsEstimate(gb: number): number {
  return gb * 5e4
}

export async function resetAndClear(): Promise<void> {
  await appData.clearDataDir()
  await appConfig.remove()
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

export function promiseTimeout<T>(ms: number, promise: Promise<T>): Promise<T> {
  // Create a promise that rejects in <ms> milliseconds
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject('Timed out in ' + ms + 'ms.')
    }, ms);

  });

  // Returns a race between our timeout and the passed in promise
  return Promise.race<T>([
    promise,
    timeout
  ]);
}

const apiTypes = {
  Solution: {
    public_key: "AccountId32",
    reward_address: "AccountId32"
  },
  SubPreDigest: {
    slot: "u64",
    solution: "Solution"
  }
}

export const PIECE_SIZE = 4096
export const GB = 1024 * 1024 * 1024
export const CONTEXT_MENU = process.env.DEV || "OFF" // enables context menu only if DEV mode is on

export function createApi(url: string | string[]): ApiPromise {
  return new ApiPromise({
    provider: new WsProvider(url, false),
    types: apiTypes,
    throwOnConnect: true,
  });
}

export function generateNodeName(): string {
  let nodeName = ""
  do {
    const slug = generateSlug(2)
    const num = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
    nodeName = slug + "-" + num.toString()
  } while (nodeName.length > nodeNameMaxLength)
  return nodeName
}
