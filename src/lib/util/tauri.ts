// tauri related utils have to be in the separate module, otherwise unit tests will fail:
// tauri api requires access to global navigator, which is limited within tests
import { invoke } from '@tauri-apps/api/tauri';
import { LocalStorage } from 'quasar';

import { IPlotDir } from '../plotDir';
import Config, { IConfig } from '../config';
import { getErrorMessage } from './';

export const appName: string = process.env.APP_NAME || 'subspace-desktop';

/**
 * Utility to get log file location
 * @returns {string} path - logs location
 */
export async function getLogPath(): Promise<string> {
  return await invoke('custom_log_dir', { id: appName });
}

/**
 * Utility wrapper for logging errors
 */
export async function errorLogger(error: unknown): Promise<void> {
  const message = getErrorMessage(error);
  await invoke('frontend_error_logger', { message });
}

/**
 * Utility wrapper for regular logging
 */
export async function infoLogger(info: unknown): Promise<void> {
  const message = getErrorMessage(info);
  await invoke('frontend_info_logger', { message });
}

/**
 * Utility to reset the application, removes files from local storage, as well as config file
 */
export async function resetAndClear({
  localStorage,
  plotDir,
  config,
}: {
  localStorage: LocalStorage;
  plotDir: IPlotDir;
  config: Config;
}): Promise<void> {
  await localStorage.clear();
  await plotDir.removePlot(config);
  // this may throw error that file does not exist if config file is in the same directory as plot files (removed on the line above)
  await config.remove();
}

/**
 * Utility to create the log file with restricted permissions
 */
export async function writeConfig(
  configFullPath: string,
  config: IConfig
): Promise<void> {
  await invoke('create_config', {
    path: configFullPath,
    content: JSON.stringify(config, null, 2)
  });
}

/**
 * Utility to create a directory
 */
export async function createDir(path: string): Promise<void> {
  await invoke('create_dir', { path });
}

/**
 * Utility to remove a directory along with all its contents
 */
 export async function removeDir(path: string): Promise<void> {
  await invoke('remove_dir', { path });
}

/**
 * Utility to write to a file
 */
export async function writeFile(
  path: string,
  contents: string
): Promise<void> {
  await invoke('write_file', { path, contents });
}

/**
 * Utility to remove a file
 */
export async function removeFile(path: string): Promise<void> {
  await invoke('remove_file', { path });
}

/**
 * Utility read a file
 * @returns {string} contents of the file
 */
export async function readFile(path: string): Promise<string> {
  return await invoke('read_file', { path });
}

/**
 * Utility to get entry count in the given directory
 * @returns {number} how many entries are there in the directory, -1 means directory does not exist
 */
export async function entryCountDirectory(path: string): Promise<number> {
  return await invoke('entry_count_directory', { path });
}
