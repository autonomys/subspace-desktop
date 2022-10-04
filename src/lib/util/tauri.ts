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

export async function writeFile(
  configFullPath: string,
  config: IConfig
): Promise<void> {
  await invoke('create_file', {
    path: configFullPath,
    content: JSON.stringify(config, null, 2)
  });
}
