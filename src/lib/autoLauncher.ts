import * as fs from '@tauri-apps/api/fs';

import * as native from './native';
import { ChildReturnData } from './types';
import { errorLogger } from './util';
import Config from './config';

interface WinOrMacAutoLauncherProps {
  appName: string,
  appPath: string,
  native: typeof native;
}

interface LinuxAutoLauncherProps {
  appName: string,
  appPath: string,
  configDir: string;
  fs: typeof fs,
}

export class LinuxAutoLauncher {
  private appName: string;
  private appPath: string;
  private fs: typeof fs;
  private configDir: string;

  constructor({ appName, appPath, fs, configDir }: LinuxAutoLauncherProps) {
    this.appName = appName;
    this.appPath = appPath;
    this.fs = fs;
    this.configDir = configDir;
  }

  public async enable(minimized: boolean): Promise<ChildReturnData> {
    const autostartAppFile = await this.createAutostartDir();
    const response: ChildReturnData = { stderr: [], stdout: [] };
    const hiddenArg = minimized ? ' --minimized' : '';
    const contents = `
      [Desktop Entry]
      Type=Application
      Name=${this.appName}
      Comment=${this.appName} startup script
      Exec=${this.appPath}${hiddenArg}
      Icon=${this.appName}
    `;
    await this.fs.writeFile({ contents, path: autostartAppFile });
    response.stdout.push('success');
    return response;
  }

  public async disable(): Promise<ChildReturnData> {
    const autostartAppFile = this.getAutostartFilePath();
    const response: ChildReturnData = { stderr: [], stdout: [] };
    await this.fs.removeFile(autostartAppFile);
    response.stdout.push('success');
    return response;
  }

  public async isEnabled(): Promise<boolean> {
    try {
      const autostartAppFile = this.getAutostartFilePath();
      await this.fs.readTextFile(autostartAppFile);
      return true;
    } catch (error) {
      errorLogger(error);
      return false;
    }
  }

  private getAutostartFilePath(): string {
    const autostartAppFile = this.configDir + 'autostart/' + this.appName + '.desktop';
    return autostartAppFile;
  }

  private async createAutostartDir(): Promise<string> {
    const autostartDirectory = this.configDir + 'autostart/';
    const existDir = await this.fs.readDir(autostartDirectory);
    if (!existDir) {
      await this.fs.createDir(autostartDirectory);
    }
    return autostartDirectory + this.appName + '.desktop';
  }
}

export class MacOSAutoLauncher {
  private appName: string;
  private appPath: string;
  private native: typeof native;

  constructor({ appName, appPath, native }: WinOrMacAutoLauncherProps) {
    this.appName = appName;
    this.appPath = appPath;
    this.native = native;
  }

  public async enable(minimized: boolean): Promise<ChildReturnData> {
    // on macOS, tauri is returning the binary (which is a UnixExecutable). We want the `.app` file instead.
    // appPath -> "/Users/xxx/subspace-desktop.app/Contents/MacOS/subspace-desktop"
    // path -> "/Users/xxx/subspace-desktop.app"
    const path = this.appPath.split('/Contents')[0];
    const isHiddenValue = minimized ? 'true' : 'false';
    const properties = `{path:"${path}", hidden:${isHiddenValue}, name:"${this.appName}"}`;
    return this.native.execApplescriptCommand(`make login item at end with properties ${properties}`);
  }

  public async disable(): Promise<ChildReturnData> {
    return this.native.execApplescriptCommand(`delete login item "${this.appName}"`);
  }

  public async isEnabled(): Promise<boolean> {
    const response: ChildReturnData = await this.native.execApplescriptCommand('get the name of every login item');
    const loginList = response?.stdout[0]?.split(', ') || [];
    const exists = loginList.includes(this.appName);
    console.log('login Item Exists:', exists);
    return exists;
  }
}

export class WindowsAutoLauncher {
  private appName: string;
  private appPath: string;
  private native: typeof native;
  private subKey = 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run';

  constructor({ appName, appPath, native }: WinOrMacAutoLauncherProps) {
    this.appName = appName;
    this.appPath = appPath;
    this.native = native;
  }

  // TODO add support for hidden on windows
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async enable(minimized: boolean): Promise<ChildReturnData> {
    const returnVal = <ChildReturnData>{ stdout: [], stderr: [] };
    const result = await this.native.winregSet(this.subKey, this.appName, this.appPath);
    if (result.search('success') > -1) {
      returnVal.stdout.push(result);
    } else {
      returnVal.stderr.push(result);
    }
    return returnVal;
  }

  public async disable(): Promise<ChildReturnData> {
    const returnVal = <ChildReturnData>{ stdout: [], stderr: [] };
    const result = <string>(await this.native.winregDelete(this.subKey, this.appName));
    if (result.search('success') > -1) {
      returnVal.stdout.push(result);
    } else {
      returnVal.stderr.push(result);
    }
    return returnVal;
  }

  public async isEnabled(): Promise<boolean> {
    const result = <string>(await this.native.winregGet(this.subKey, this.appName));
    console.log('isEnabled result:', result);
    if (result.search('The system cannot find the file specified.') > -1) {
      return false;
    } else {
      return true;
    }
  }
}

interface AutoLauncherParams {
  config: Config;
  osAutoLauncher: MacOSAutoLauncher | WindowsAutoLauncher | LinuxAutoLauncher;
}

/**
 * AutoLauncher class responsible for enabling and disabling auto launch for particular OS
 */
class AutoLauncher {
  private osAutoLauncher: MacOSAutoLauncher | WindowsAutoLauncher | LinuxAutoLauncher;
  private enabled = false;
  private config: Config;

  /**
   * Create AutoLauncher instance
   * @param {AutoLauncherParams} params
   * @param {MacOSAutoLauncher | WindowsAutoLauncher | LinuxAutoLauncher} params.osAutoLauncher - internal auto launcher for particular OS
   * @param {Config} params.config - Config class instance to interact with app config file
   */
  constructor({ config, osAutoLauncher }: AutoLauncherParams) {
    this.config = config;
    this.osAutoLauncher = osAutoLauncher;
  }

  // TODO: consider removing this method as redundant - call osAutoLauncher.isEnabled() directly
  /**
   * Check if internal OS auto launcher is enabled
   * @returns {boolean}
   */
  public async isEnabled(): Promise<boolean> {
    const result = await this.osAutoLauncher.isEnabled();
    this.enabled = result;
    return result;
  }

  /**
   * Enable auto launcher and update config file
   * @returns {ChildReturnData} - OS auto launcher result object
   */
  public async enable(): Promise<void | ChildReturnData> {
    const child = await this.osAutoLauncher.enable(true);
    this.enabled = await this.isEnabled();
    if (!this.enabled) {
      errorLogger('ENABLE DID NOT WORK');
    } else {
      await this.config.update({ launchOnBoot: true });
    }
    return child;
  }

  /**
   * Disable auto launcher and update config file
   * @returns {ChildReturnData} - OS auto launcher result object
   */
  public async disable(): Promise<void | ChildReturnData> {
    let child;
    let trial = 0;
    // to remove the previous entries for older versions
    // try at maximum 5 times to prevent infinite loop
    do {
      child = await this.osAutoLauncher.disable();
      this.enabled = await this.isEnabled();
      trial += 1;
    } while (this.enabled && trial < 5);
    await this.config.update({ launchOnBoot: false });
    return child;
  }

  /**
   * Read config file and enable auto launcher if necessary
   */
  public async init(): Promise<void> {
    const { launchOnBoot } = await this.config.readConfigFile();
    if (launchOnBoot) {
      // the app may be initialized before, but then user may have decided to move the app to another directory
      // in this case, we have to delete the previous autoLaunch entry, and create a new one
      // below disable is not creating console error, hence use it for this one
      await this.disable();
      await this.enable();
    }
    // if launch preference is `false`, we don't need to do anything here, it should stay as it is
    // also, config is created before autoLauncher, so there should be a config always
  }
}

export default AutoLauncher;
