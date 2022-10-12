import * as tauri from '@tauri-apps/api/tauri';

import { IConfig } from './config';
import { getErrorMessage } from './util';

/**
 * Wrapper for tauri.invoke calls, 
 * responsible for interaction with file system, logging, starting node and farmer, etc.
 */
class TauriInvoker {
  private invoke: typeof tauri.invoke;

  /**
   * Create TauriInvoker instance
   * @param tauri.invoke - tauri method to send messages to backend
   */
  public constructor(invoke: typeof tauri.invoke) {
    this.invoke = invoke;
  }

  /**
   * Create/update the config file
   * @param {IConfig} config - config object
   */
  public async writeConfig(config: IConfig): Promise<void> {
    return this.invoke('write_config', {
      content: JSON.stringify(config, null, 2)
    });
  }

  /**
   * Read config file
   * @returns {string} - stringified config object
   */
  public async readConfig(): Promise<string> {
    return this.invoke('read_config');
  }

  /**
   * Remove the config file
   */
  public async removeConfig(): Promise<void> {
    return this.invoke('remove_config');
  }

  /**
   * Remove the a directory recursively
   * @param {string} path - directory location
   */
  public async removeDir(path: string): Promise<void> {
    return this.invoke('remove_dir', { path });
  }

  /**
   * Create a directory
   * @param {string} path - directory location
   */
  public async createDir(path: string): Promise<void> {
    return this.invoke('create_dir', { path });
  }

  /**
   * Create linux autostart file
   * @param {string} hidden - command argument to hide application on start
   */
  public async createLinuxAutoLaunchFile(hidden: string): Promise<void> {
    return this.invoke('create_linux_auto_launch_file', { hidden });
  }

  /**
   * Check if linux autostart file exists
   * @returns {boolean} - `true` for file exists
   */
  public async linuxAutoLaunchFileExist(): Promise<boolean> {
    return this.invoke('linux_auto_launch_file_exist');
  }

  /**
   * Remove the linux autostart file
   */
  public async removeLinuxAutoLaunchFile(): Promise<void> {
    return this.invoke('remove_linux_auto_launch_file');
  }

  /**
   * Get entry count in the given directory
   * @param {string} path - directory location
   * @returns {number} how many entries are there in the directory, -1 means directory does not exist
   */
  public async entryCountDirectory(path: string): Promise<number> {
    return this.invoke('entry_count_directory', { path });
  }

  /**
   * Check if directory exists, utilizing method above
   * @param {string} path - directory location
   * @returns {boolean} true for directory exist
   */
  public async isDirExist(path: string): Promise<boolean> {
    return (await this.invoke('entry_count_directory', { path }) as number) !== -1;
  }

  /**
   * Regular logging
   * @param {unknown} info - data to log
   */
  public async infoLogger(info: unknown): Promise<void> {
    const message = getErrorMessage(info);
    return this.invoke('frontend_info_logger', { message });
  }

  /**
   * Error logging
   * @param {unknown} error - error to log
   */
  public async errorLogger(error: unknown): Promise<void> {
    const message = getErrorMessage(error);
    return this.invoke('frontend_error_logger', { message });
  }

  /**
   * Get log file location
   * @returns {string} path - logs location
   */
  public async openLogDir(): Promise<string> {
    return this.invoke('open_log_dir');
  }

  /**
   * Start farming
   * @param {string} path - plot directory location
   * @param {string} rewardAddress - address used to get farming rewards
   * @param {number} plotSize - size of the plot used for farming
   */
  public async startFarming(path: string, rewardAddress: string, plotSize: number): Promise<void> {
    return this.invoke('farming', { path, rewardAddress, plotSize });
  }

  /**
   * Start node
   * @param {string} path - base directory
   * @param {string} nodeName - node name (displayed in the app header and Telemetry)
   */
  public async startNode(path: string, nodeName: string): Promise<void> {
    return this.invoke('start_node', { path, nodeName });
  }
}

export default TauriInvoker;
