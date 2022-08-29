import * as tauri from '@tauri-apps/api';

import { ChildReturnData } from './types';
import * as applescript from './applescript';

export interface DriveStats {
  freeBytes: number
  totalBytes: number
}
export interface TauriDriveStats {
  free_bytes: number
  total_bytes: number
}

/**
 * Utility function to select file directory when setting up plot
 * @param {undefined | string} defaultPath - plot path
 * @returns {null | string} - selected path
 */
export async function selectDir(defaultPath: undefined | string): Promise<string | null> {
  let exists = false;
  if (defaultPath) exists = await dirExists(defaultPath);
  if (!exists) defaultPath = undefined;
  const result = (await tauri.dialog.open({ directory: true, defaultPath })) as null | string;
  return result;
}

/**
 * Utility function to check if file directory exists
 * @param {string} dir - directory to check
 * @returns {boolean}
 */
export async function dirExists(dir: string): Promise<boolean> {
  return (await tauri.fs.readDir(dir, { recursive: false }).catch(console.error)) ? true : false;
}

// TODO: consider adding this as a method for SetupPlot (not used anywhere else)
/**
 * Utility function to get drive stats (free space, total space)
 * @param {string} dir - directory to check
 * @returns {DriveStats} - drive stats object
 */
export async function driveStats(dir: string): Promise<DriveStats> {
  const result = (await tauri.invoke('get_disk_stats', { dir })) as TauriDriveStats;
  const stats: DriveStats = { freeBytes: result.free_bytes, totalBytes: result.total_bytes };
  return stats;
}

// TODO: consider adding this as a method for WindowsAutoLauncher (not used anywhere else)
/**
 * Utility function to get data from Windows registry
 * @param {string} subKey - registry sub key, for example 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run'
 * @param {string} value - value, for example application name
 * @returns {string} - query result
 */
export async function winregGet(subKey: string, value: string): Promise<string> {
  const result = (await tauri.invoke('winreg_get', { subKey, value })) as string;
  return result;
}

// TODO: consider adding this as a method for WindowsAutoLauncher (not used anywhere else)
/**
 * Utility function to set data in Windows registry
 * @param {string} subKey - registry sub key, for example 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run'
 * @param {string} setKey - registry key to set value for 
 * @param {string} value
 * @returns {string} - result string
 */
export async function winregSet(subKey: string, setKey: string, value: string): Promise<string> {
  const result = (await tauri.invoke('winreg_set', { subKey, setKey, value })) as string;
  return result;
}

// TODO: consider adding this as a method for WindowsAutoLauncher (not used anywhere else)
/**
 * Utility function to delete data from Windows registry
 * @param {string} subKey - registry sub key, for example 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run'
 * @param {string} setKey - registry key
 * @returns {string} - result string
 */
export async function winregDelete(subKey: string, setKey: string): Promise<string> {
  const result = (await tauri.invoke('winreg_delete', { subKey, setKey })) as string;
  return result;
}

// TODO: consider adding this as a method for MacOSAutoLauncher (not used anywhere else)
/**
 * Utility function to execute shell command on MacOS
 * @param {string} command - command to execute, for example get, set or remove login item
 * @returns {ChildReturnData} - output object
 */
export async function execApplescriptCommand(command: string): Promise<ChildReturnData> {
  const result = applescript.execString(`tell application "System Events" to ${command}`);
  return result;
}
