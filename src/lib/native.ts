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
import winAL from "src/lib/autoLaunch/macAutoLaunch"
import linAL from "src/lib/autoLaunch/macAutoLaunch"
type osAL = typeof macAL | typeof winAL | typeof linAL
const tauri = { app, dialog, fs, path, invoke, shell, os, window, process: tProcess }
export interface DriveStats {
  freeBytes: number
  totalBytes: number
}
export interface AutoLaunchType {
  isEnabled(): Promise<boolean>
  enable(): Promise<any>
  disable(): Promise<any>
}

export async function autoLaunch(): Promise<AutoLaunchType> {
  const appName = process.env.DEV ? "app" : (await tauri.app.getName()).toString()
  const os = (await tauri.os.type())
  const appPath = await tauri.invoke('get_this_binary') as string
  console.log('get_this_binary', appPath);
  console.log(appPath);
  let autoLauncher: osAL
  if (os == 'Darwin') autoLauncher = macAL
  else if (os == 'Windows_NT') autoLauncher = winAL
  else autoLauncher = linAL
  return <AutoLaunchType>{
    async isEnabled(): Promise<boolean> {
      const result = await autoLauncher.isEnabled(appName)
      return result
    },
    async enable(): Promise<any> {
      const child = await autoLauncher.enable({ appName, appPath, hidden: false })
      return child
    },
    async disable(): Promise<any> {
      const child = autoLauncher.disable(appName)
      return child
    }
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
  const result = await tauri.invoke('get_disk_stats', { dir }) as any
  const stats: DriveStats = { freeBytes: result.free_bytes, totalBytes: result.total_bytes }
  return stats
}