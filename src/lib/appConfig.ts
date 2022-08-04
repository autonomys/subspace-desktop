import { path, fs } from '@tauri-apps/api';

import { appName, errorLogger, toFixed } from './util';

export interface IConfig {
  configDir: () => Promise<string>;
  configFullPath: () => Promise<string>;
  init: () => Promise<void>;
  validate: () => Promise<boolean>;
  remove: () => Promise<void>;
  read: () => Promise<Config>;
  write: (config: Config) => Promise<void>;
  update: (params: ConfigUpdate) => Promise<void>;
}

export interface Plot {
  location: string
  sizeGB: number
}

interface Config {
  [index: string]: any
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

const emptyConfig: Config = {
  plot: { location: '', sizeGB: 0 },
  rewardAddress: '',
  launchOnBoot: true,
  version: process.env.APP_VERSION as string,
  nodeName: '',
};

// TODO: refactor as a class, add logger as dependency, add unit tests
// TODO: consider adding methods to handle other files (not just config file) and rename
export const config: IConfig = {
  // TODO: add this as a class property instead of method
  /**
   * Get config file directory
   * @returns {string} - path to config directory
   */
  async configDir(): Promise<string> {
    return (await path.configDir()) + appName;
  },
  // TODO: add this as a class property instead of method
  /**
   * Get path to config file
   * @returns {string} - path to config file
   */
  async configFullPath(): Promise<string> {
    return (await path.configDir()) + appName + '/' + appName + '.cfg';
  },
  // TODO: should be part of class constructor
  /**
   * Initialize config
   */
  async init(): Promise<void> {
    try {
      await this.read();
    } catch {
      // TODO: should propagate error, so it can be handled on UI
      // means there were no config file
      await fs.createDir(await this.configDir()).catch((error) => {
        if (!error.includes('exists')) {
          errorLogger(error);
        }
      });
      await this.write(emptyConfig);
    }
  },
  /**
   * Check if config is valid - has plot properties, reward address and node name stored
   * @returns {boolean}
   */
  async validate(): Promise<boolean> {
    const config = await this.read();
    const { plot, rewardAddress, nodeName } = config;
    if (
      plot.location.length > 0 &&
      plot.sizeGB > 0 &&
      rewardAddress.length > 0 &&
      nodeName.length > 0
    ) {
      return true;
    }
    return false;
  },
  // TODO: should propagate error, so it can be handled on UI
  /**
   * Remove config file from the file system. Used for reset
   */
  async remove(): Promise<void> {
    await fs.removeFile(await this.configFullPath()).catch((error) => {
      errorLogger(error);
    });
  },
  /**
   * Read config file
   * @returns {Config} - config object
   */
  async read(): Promise<Config> {
    const result = await fs.readTextFile(await this.configFullPath());
    const config: Config = JSON.parse(result);
    // TODO: there maybe a better solution, or `sizeGB` should be string in the first place
    config.plot.sizeGB = toFixed(Number(config.plot.sizeGB), 2);
    return config;
  },
  /**
   * Write config file to the file system
   * @param {Config} - config object to store as config file
   */
  async write(config: Config): Promise<void> {
    // TODO: should propagate error, so it can be handled on UI
    await fs.createDir(await this.configDir()).catch((error) => {
      if (!error.includes('exists')) {
        errorLogger(error);
      }
    });
    // TODO: should propagate error, so it can be handled on UI
    await fs.writeFile({
      path: await this.configFullPath(),
      contents: JSON.stringify(config, null, 2)
    })
      .catch((error) => {
        errorLogger(error);
      });
  },
  /**
   * Update config file with given values
   * @param {ConfigUpdate} - object with properties to update in the config file
   */
  async update({
    plot,
    launchOnBoot,
    rewardAddress,
    version,
    nodeName,
  }: ConfigUpdate): Promise<void> {
    const newAppConfig = await this.read();

    // TODO: refactor using object spread operator
    if (plot !== undefined) newAppConfig.plot = plot;
    if (launchOnBoot !== undefined) newAppConfig.launchOnBoot = launchOnBoot;
    if (rewardAddress !== undefined) newAppConfig.rewardAddress = rewardAddress;
    if (version !== undefined) newAppConfig.version = version;
    if (nodeName !== undefined) newAppConfig.nodeName = nodeName;
    await this.write(newAppConfig);
  },
};
