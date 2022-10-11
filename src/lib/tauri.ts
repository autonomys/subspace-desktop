import * as tauri from '@tauri-apps/api/tauri';

import { IConfig } from './config';
import { getErrorMessage } from './util';

// TODO: add doc comments
class TauriInvoker {
  private invoke: typeof tauri.invoke;

  public constructor(invoke: typeof tauri.invoke) {
    this.invoke = invoke;
  }

  /**
   * Utility for creating/updating the config file
   */
  public async writeConfig(config: IConfig): Promise<void> {
    return this.invoke('write_config', {
      content: JSON.stringify(config, null, 2)
    });
  }

  /**
   * Utility to read config file
   * @returns {string} - stringified config object
   */
  public async readConfig(): Promise<string> {
    return this.invoke('read_config');
  }

  /**
   * Utility to remove the config file
   */
  public async removeConfig(): Promise<void> {
    return this.invoke('remove_config');
  }

  /**
   * Utility to remove the a directory recursively
   */
  public async removeDir(path: string): Promise<void> {
    return this.invoke('remove_dir', { path });
  }

  /**
   * Utility to create a directory
   */
  public async createDir(path: string): Promise<void> {
    return this.invoke('create_dir', { path });
  }

  /**
   * Utility to create linux autostart file
   */
  public async createLinuxAutoLaunchFile(hidden: string): Promise<void> {
    return this.invoke('create_linux_auto_launch_file', { hidden });
  }

  /**
   * Utility to check if linux autostart file exists
   * @returns {boolean} - `true` for file exists
   */
  public async linuxAutoLaunchFileExist(): Promise<boolean> {
    return this.invoke('linux_auto_launch_file_exist');
  }

  /**
   * Utility to remove the linux autostart file
   */
  public async removeLinuxAutoLaunchFile(): Promise<void> {
    return this.invoke('remove_linux_auto_launch_file');
  }

  /**
   * Utility to get entry count in the given directory
   * @returns {number} how many entries are there in the directory, -1 means directory does not exist
   */
  public async entryCountDirectory(path: string): Promise<number> {
    return this.invoke('entry_count_directory', { path });
  }

  /**
   * Utility to check if directory exists
   * the backend function returns -1 if directory does not exist
   * @returns {boolean} true for directory exist
   */
  public async isDirExist(path: string): Promise<boolean> {
    return (await this.invoke('entry_count_directory', { path }) as number) !== -1;
  }

  /**
   * Utility wrapper for regular logging
   */
  public async infoLogger(info: unknown): Promise<void> {
    const message = getErrorMessage(info);
    return this.invoke('frontend_info_logger', { message });
  }

  /**
   * Utility wrapper for logging errors
   */
  public async errorLogger(error: unknown): Promise<void> {
    const message = getErrorMessage(error);
    return this.invoke('frontend_error_logger', { message });
  }

  /**
   * Utility to get log file location
   * @returns {string} path - logs location
   */
  public async openLogDir(): Promise<string> {
    return this.invoke('open_log_dir');
  }

  /**
   * Utility to start farming
   */
  public async startFarming(path: string, rewardAddress: string, plotSize: number): Promise<void> {
    return this.invoke('farming', { path, rewardAddress, plotSize });
  }

  /**
   * Utility to start node
   */
  public async startNode(path: string, nodeName: string): Promise<void> {
    return this.invoke('start_node', { path, nodeName });
  }
}

export default TauriInvoker;
