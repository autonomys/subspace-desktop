import * as dialog from "@tauri-apps/api/dialog"
import * as fs from "@tauri-apps/api/fs"
import * as path from "@tauri-apps/api/path"
import * as shell from "@tauri-apps/api/shell"
import * as app from "@tauri-apps/api/app"
import { invoke } from '@tauri-apps/api/tauri'
import macAL from "src/lib/autoLaunch/macAutoLaunch"
const tauri = { app, dialog, fs, path, invoke, shell }
export interface DriveStats {
  freeBytes: number,
  totalBytes: number
}

export async function autoLaunch(enable: boolean) {
  try {
    const appName = (await tauri.app.getName()).toString()
    // const appPath = (await tauri.path.appDir()).toString()
    const appPath = "/bin/bash"
    if (enable) macAL.enable({ appName, appPath, hidden: false })
    else macAL.disable(appName)
  } catch (error) {
    console.error('native.autoLaunch error:', error.toString());
  }
}

export async function execString(cmd: string) {
  const command = new tauri.shell.Command('mkdir', 'derp')
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