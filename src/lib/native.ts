import * as dialog from "@tauri-apps/api/dialog"
import * as fs from "@tauri-apps/api/fs"
import * as path from "@tauri-apps/api/path"
import { invoke } from '@tauri-apps/api/tauri'
const tauri = { dialog, fs, path, invoke }
export interface DriveStats {
  freeBytes: number,
  totalBytes: number
}

export async function execString(cmd: string) {
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