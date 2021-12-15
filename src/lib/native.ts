import * as dialog from "@tauri-apps/api/dialog"
import * as fs from "@tauri-apps/api/fs"
import * as path from "@tauri-apps/api/path"
import * as shell from "@tauri-apps/api/shell"
import * as app from "@tauri-apps/api/app"
import * as os from "@tauri-apps/api/os"
import * as window from "@tauri-apps/api/window"
import * as tProcess from "@tauri-apps/api/process"
import { invoke } from '@tauri-apps/api/tauri'
import { ChildReturnData } from "./types";
import * as applescript from "./applescript"

const tauri = { app, dialog, fs, path, invoke, shell, os, window, process: tProcess }
export interface DriveStats {
  freeBytes: number
  totalBytes: number
}
export interface TauriDriveStats {
  free_bytes: number
  total_bytes: number
}

export async function execString(executable: string, args: string[] | string): Promise<void> {
  const command = new tauri.shell.Command(executable, args)
  command.on('close', data => {
    console.log(`command finished with code ${data.code} and signal ${data.signal}`)
  })
  command.on('error', error => console.error(`command error: "${error}"`))
  command.stdout.on('data', line => console.log(`command stdout: "${line}"`))
  command.stderr.on('data', line => console.log(`command stderr: "${line}"`))

  const child = await command.spawn()

  console.log('pid:', child.pid)
}
export async function createDir(path: string): Promise<void> {
  await tauri.fs.createDir(path).catch(console.error)
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
  const something = (await tauri.invoke('farming'))
  const stats: DriveStats = { freeBytes: result.free_bytes, totalBytes: result.total_bytes }
  return stats
}
//TODO Refactor into special case function instead of general utility function
export async function winregGet(subKey: string, value: string): Promise<string> {
  const result = (await tauri.invoke('winreg_get', { subKey, value })) as string
  return result
}

//TODO Refactor into special case function instead of general utility function
export async function winregSet(subKey: string, setKey: string, value: string): Promise<string> {
  const result = (await tauri.invoke('winreg_set', { subKey, setKey, value })) as string
  return result
}

//TODO Refactor into special case function instead of general utility function
export async function winregDelete(subKey: string, setKey: string): Promise<string> {
  const result = (await tauri.invoke('winreg_delete', { subKey, setKey })) as string
  return result
}

//TODO Refactor into special case function instead of general utility function
export async function execApplescriptCommand(commandSuffix: string): Promise<ChildReturnData> {
  const result = applescript.execString(`tell application "System Events" to ${commandSuffix}`)
  return result
}
