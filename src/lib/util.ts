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

export const native = {
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
  async driveStats(dir: string) {
    const result = await tauri.invoke('get_disk_stats', { dir: 'Hello!' })
    console.log(result);
  }
}