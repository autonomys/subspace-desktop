// tauri related utils have to be in the separate module, otherwise unit tests will fail:
// tauri api requires access to global navigator, which is limited within tests
import { invoke } from '@tauri-apps/api/tauri';
import { LocalStorage } from 'quasar';

import { IPlotDir } from '../plotDir';
import Config from '../config';

export const appName: string = process.env.APP_NAME || 'subspace-desktop';

/**
 * Utility to get log file location
 * @returns {string} path - logs location
 */
export async function getLogPath(): Promise<string> {
  return await invoke('custom_log_dir', { id: appName });
}

// TODO: refactor using getErrorMessage from utils.ts
/**
 * Utility wrapper for logging errors
 */
export async function errorLogger(error: unknown): Promise<void> {
  if (error instanceof Error) {
    const message = error.message;
    await invoke('frontend_error_logger', { message });
  } else if (typeof error === 'string') {
    await invoke('frontend_error_logger', { message: error });
  }
}

// TODO: refactor using getErrorMessage from utils.ts
/**
 * Utility wrapper for regular logging
 */
export async function infoLogger(info: unknown): Promise<void> {
  if (info instanceof Error) {
    const message = info.message;
    await invoke('frontend_info_logger', { message });
  } else if (typeof info === 'string') {
    await invoke('frontend_info_logger', { message: info });
  }
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
  try {
    await localStorage.clear();
    await plotDir.removePlot(config);
    // this may throw error that file does not exist if config file is in the same directory as plot files (removed on the line above)
    await config.remove();
  } catch (error) {
    errorLogger(error);
  }
}
