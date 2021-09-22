import * as dialog from "@tauri-apps/api/dialog"
import * as fs from "@tauri-apps/api/fs"
import * as path from "@tauri-apps/api/path"
import * as shell from "@tauri-apps/api/shell"
import * as app from "@tauri-apps/api/app"
import * as os from "@tauri-apps/api/os"
import * as window from "@tauri-apps/api/window"
import * as tProcess from "@tauri-apps/api/process"
// import { invokeTauriCommand } from "@tauri-apps/api/"
import { invoke } from '@tauri-apps/api/tauri'
import macAL from "src/lib/autoLaunch/macAutoLaunch"
import winAL from "src/lib/autoLaunch/winAutoLaunch"
import linAL from "src/lib/autoLaunch/nullAutoLaunch"
import nullAL from "src/lib/autoLaunch/nullAutoLaunch"
import * as applescript from "src/lib/osUtils/applescript"

import { ChildReturnData } from "./types"
type osAL = typeof macAL | typeof winAL | typeof linAL | typeof nullAL
const tauri = { app, dialog, fs, path, invoke, shell, os, window, process: tProcess }
export interface DriveStats {
  freeBytes: number
  totalBytes: number
}
export interface TauriDriveStats {
  free_bytes: number
  total_bytes: number
}
export class AutoLauncher {
  protected autoLauncher: osAL = nullAL
  appName: string = 'app'
  appPath: string = ''
  enabled: boolean = false
  async isEnabled(): Promise<boolean> {
    const result = await this.autoLauncher.isEnabled(this.appName)
    this.enabled = result
    return result
  }
  async enable(): Promise<void | ChildReturnData> {
    const child = await this.autoLauncher.enable({ appName: this.appName, appPath: this.appPath, hidden: false })
    return child
  }
  async disable(): Promise<void | ChildReturnData> {
    const child = this.autoLauncher.disable(this.appName)
    return child
  }
  async init() {
    this.appName = process.env.DEV ? "app" : (await tauri.app.getName()).toString()
    const os = await tauri.os.type()
    this.appPath = await tauri.invoke('get_this_binary') as string
    console.log('get_this_binary', this.appPath);
    console.log(this.appPath);
    if (os == 'Darwin') this.autoLauncher = macAL
    else if (os == 'Windows_NT') this.autoLauncher = winAL
    else this.autoLauncher = linAL
    this.enabled = (await this.isEnabled())
  }
}

export async function execString(executable: string, args: string[] | string) {
  const command = new tauri.shell.Command(executable, args)
  command.on('close', data => {
    console.log(`command finished with code ${data.code} and signal ${data.signal}`)
  })
  command.on('error', error => console.error(`command error: "${error}"`))
  command.stdout.on('data', line => console.log(`command stdout: "${line}"`))
  command.stderr.on('data', line => console.log(`command stderr: "${line}"`))

  const child = await command.spawn()

  console.log('pid:', child.pid)

  return true
}
export async function createDir(path: string) {
  const result = await tauri.fs.createDir(path).catch(console.error)
  return result
}
export async function selectDir(defaultPath: undefined | string): Promise<string | null> {
  let exists: boolean = false
  if (defaultPath) exists = await dirExists(defaultPath)
  if (!exists) defaultPath = undefined
  const result = (await tauri.dialog.open({ directory: true, defaultPath })) as null | string
  return result
}
export async function dirExists(dir: string): Promise<boolean> {
  return (await tauri.fs.readDir(dir, { recursive: false }).catch(console.error)) ? true : false
}
export async function driveStats(dir: string): Promise<DriveStats> {
  const result = (await tauri.invoke('get_disk_stats', { dir })) as TauriDriveStats
  const stats: DriveStats = { freeBytes: result.free_bytes, totalBytes: result.total_bytes }
  return stats
}

export async function winregGet(subKey: string, value: string): Promise<string> {
  const result = (await tauri.invoke('winreg_get', { subKey, value })) as string
  console.log(result);
  return result
}

export async function winregSet(subKey: string, setKey: string, value: string): Promise<string> {
  const result = (await tauri.invoke('winreg_set', { subKey, setKey, value })) as string
  console.log(result);
  return result
}

export async function winregDelete(subKey: string, setKey: string): Promise<string> {
  const result = (await tauri.invoke('winreg_delete', { subKey, setKey })) as string
  console.log(result);
  return result
}

export async function execApplescriptCommand(commandSuffix: string): Promise<ChildReturnData> {
  const result = applescript.execString(`tell application "System Events" to ${commandSuffix}`)
  return result
}
