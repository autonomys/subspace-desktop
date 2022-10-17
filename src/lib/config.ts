import TauriInvoker from './tauri';
import { toFixed, getErrorMessage } from './util';

interface FilesParams {
  configDir: string;
  appName: string;
  tauri: TauriInvoker;
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
 * Class responsible for reading, initializing, updating or deleting config file,
 * uses TauriInvoker to interact with file system
 */
class Config {
  private configPath: string;
  private tauri: TauriInvoker;

  constructor({ configDir, appName, tauri }: FilesParams) {
    this.configPath = `${configDir}${appName}`;
    this.tauri = tauri;
  }

  /**
   * Initialize config
   */
  public async init(): Promise<void> {
    try {
      await this.tauri.readConfig();
    } catch {
      // means there were no config file
      await this.tauri.createDir(this.configPath)
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
    return this.tauri.removeConfig();
  }

  /**
   * Read config file
   * @returns {IConfig} - config object
   */
  public async readConfigFile(): Promise<IConfig> {
    const result = await this.tauri.readConfig();
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
    return this.tauri.writeConfig(config);
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
