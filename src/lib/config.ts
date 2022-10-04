import * as fs from '@tauri-apps/api/fs';

import { toFixed, getErrorMessage } from './util/util';

interface FilesParams {
  fs: typeof fs;
  configDir: string;
  appName: string;
  writeFile: (configFullPath: string, config: IConfig) => Promise<void>;
}

export interface Plot {
  location: string
  sizeGB: number
}

export interface IConfig {
  plot: Plot
  rewardAddress: string,
  launchOnBoot: boolean,
  version: string,
  nodeName: string,
}

interface ConfigUpdate {
  plot?: Plot;
  launchOnBoot?: boolean;
  rewardAddress?: string;
  version?: string;
  nodeName?: string;
}

export const emptyConfig: IConfig = {
  plot: { location: '', sizeGB: 0 },
  rewardAddress: '',
  launchOnBoot: true,
  version: process.env.APP_VERSION as string,
  nodeName: '',
};

/**
 * Wrapper for tauri.fs methods to read, update or delete config file
 */
class Config {
  private fs: typeof fs;
  private configPath: string;
  private configFullPath: string;
  private writeFile: (configFullPath: string, config: IConfig) => Promise<void>;

  constructor({ fs, configDir, appName, writeFile }: FilesParams) {
    this.fs = fs;
    this.configPath = `${configDir}${appName}`;
    this.configFullPath = `${this.configPath}/${appName}.cfg`;
    this.writeFile = writeFile;
  }

  /**
   * Initialize config
   */
  public async init(): Promise<void> {
    try {
      await this.readConfigFile();
    } catch {
      // means there were no config file
      await this.fs.createDir(this.configPath)
        // ignore error if folder exists otherwise throw error
        .catch((error) => {
          const message = getErrorMessage(error);
          if (message && message.includes('exists')) return;
          throw error;
        });
      await this.write(emptyConfig);
    }
  }

  /**
   * Check if config is valid - has plot properties, reward address and node name stored
   * @returns {boolean}
   */
  public async validate(): Promise<boolean> {
    const config = await this.readConfigFile();
    const { plot, rewardAddress, nodeName } = config;
    if (
      plot.location.length &&
      plot.sizeGB &&
      rewardAddress.length &&
      nodeName.length
    ) {
      return true;
    }
    return false;
  }

  /**
   * Remove config file from the file system. Used for reset
   */
  public async remove(): Promise<void> {
    await this.fs.removeFile(this.configFullPath);
  }

  /**
   * Read config file
   * @returns {Config} - config object
   */
  public async readConfigFile(): Promise<IConfig> {
    const result = await this.fs.readTextFile(this.configFullPath);
    const config: IConfig = JSON.parse(result);
    // TODO: there maybe a better solution, or `sizeGB` should be string in the first place
    config.plot.sizeGB = toFixed(Number(config.plot.sizeGB), 2);
    return config;
  }

  /**
   * Write config file to the file system
   * @param {IConfig} - config object to store as config file
   */
  private async write(config: IConfig): Promise<void> {
    return this.writeFile(this.configFullPath, config);
  }

  /**
   * Update config file with given values
   * @param {ConfigUpdate} - object with properties to update in the config file
   */
  public async update(configUpdate: ConfigUpdate): Promise<void> {
    const config = await this.readConfigFile();

    await this.write({
      ...config,
      ...configUpdate
    });
  }
}

export default Config;
