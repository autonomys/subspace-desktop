import * as tauri from '@tauri-apps/api/tauri';

import { IConfig } from './config';
import { getErrorMessage } from './util';
import { APP_NAME } from './constants';

// TODO: add doc comments
class TauriInvoker {
  private invoke: typeof tauri.invoke;

  constructor(invoke: typeof tauri.invoke) {
    this.invoke = invoke;
  }

  async writeConfig(configFullPath: string, config: IConfig): Promise<void> {
    return this.invoke('create_config', {
      path: configFullPath,
      content: JSON.stringify(config, null, 2)
    });
  }

  async removeDir(path: string): Promise<void> {
    return this.invoke('remove_dir', { path });
  }

  async createDir(path: string) {
    return this.invoke('create_dir', { path });
  }

  async removeFile(path: string): Promise<void> {
    return this.invoke('remove_file', { path });
  }

  async readFile(path: string): Promise<string> {
    return this.invoke('read_file', { path });
  }

  async openFolder(dir: string) {
    return this.invoke('open_folder', { dir });
  }

  async writeFile(
    path: string,
    contents: string
  ): Promise<void> {
    return this.invoke('write_file', { path, contents });
  }

  /**
   * Utility to get entry count in the given directory
   * @returns {number} how many entries are there in the directory, -1 means directory does not exist
   */
  async entryCountDirectory(path: string): Promise<number> {
    return this.invoke('entry_count_directory', { path });
  }

  /**
   * Utility wrapper for regular logging
   */
  async infoLogger(info: unknown): Promise<void> {
    const message = getErrorMessage(info);
    return this.invoke('frontend_info_logger', { message });
  }

  /**
   * Utility wrapper for logging errors
   */
  async errorLogger(error: unknown): Promise<void> {
    const message = getErrorMessage(error);
    return this.invoke('frontend_error_logger', { message });
  }

  /**
   * Utility to get log file location
   * @returns {string} path - logs location
   */
  async getLogPath(): Promise<string> {
    return this.invoke('custom_log_dir', { id: APP_NAME });
  }
}

export default TauriInvoker;
