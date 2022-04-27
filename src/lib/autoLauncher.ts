import * as app from "@tauri-apps/api/app"
import * as os from "@tauri-apps/api/os"
import { invoke } from '@tauri-apps/api/tauri'
import { AutoLaunchParams, ChildReturnData } from './types'
import * as fs from "@tauri-apps/api/fs"
import * as native from './native'
import * as path from "@tauri-apps/api/path"
import { appConfig } from "src/lib/appConfig"

type osAL = typeof macAL | typeof winAL | typeof linAL | typeof nullAL

const nullAL = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async enable({ appName, appPath, minimized }: AutoLaunchParams): Promise<ChildReturnData> {
    return { stdout: [], stderr: [] }
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async disable(appName: string): Promise<ChildReturnData> {
    return { stdout: [], stderr: [] }
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async isEnabled(appName: string): Promise<boolean> {
    return false
  }
}

const linAL = {

  async enable({ appName, appPath, minimized }: AutoLaunchParams): Promise<ChildReturnData> {
    const autostartAppFile = await this.createAutostartDir(appName)
    const response: ChildReturnData = { stderr: [], stdout: [] }
    const hiddenArg = minimized ? ' --minimized' : '';
    const contents = `
[Desktop Entry]
Type=Application
Name=${appName}
Comment=${appName} startup script
Exec=${appPath}${hiddenArg}
Icon=${appName}
  `
    await fs.writeFile({ contents, path: autostartAppFile }).catch(console.error)
    response.stdout.push("success")
    return response
  },
  async disable(appName: string): Promise<ChildReturnData> {
    const autostartAppFile = await this.getAutostartFilePath(appName)
    const response: ChildReturnData = { stderr: [], stdout: [] }
    await fs.removeFile(autostartAppFile).catch(console.error)
    response.stdout.push("success")
    return response
  },
  async isEnabled(appName: string): Promise<boolean> {
    try {
      const autostartAppFile = await this.getAutostartFilePath(appName)
      await fs.readTextFile(autostartAppFile).catch(console.error)
      return true
    } catch (error) {
      console.error(error)
      return false
    }
  },
  async getAutostartFilePath(appName: string): Promise<string> {
    const autostartAppFile =
      (await path.configDir()) + "autostart/" + appName + ".desktop"
    return autostartAppFile
  },
  async createAutostartDir(appName: string): Promise<string> {
    const autostartDirectory = (await path.configDir()) + "autostart/"
    const existDir = await fs.readDir(autostartDirectory).catch(console.error)
    if (!existDir) {
      await fs.createDir(autostartDirectory).catch(console.error)
    }
    return autostartDirectory + appName + ".desktop"
  }
}

const macAL = {
  async enable({ appName, appPath, minimized }: AutoLaunchParams): Promise<ChildReturnData> {
    // on macOS, tauri is returning the binary (which is a UnixExecutable). We want the `.app` file instead.
    // appPath -> "/Users/xxx/subspace-desktop.app/Contents/MacOS/subspace-desktop"
    // path -> "/Users/xxx/subspace-desktop.app"
    const path = appPath.split("/Contents")[0]
    const isHiddenValue = minimized ? 'true' : 'false';
    const properties = `{path:"${path}", hidden:${isHiddenValue}, name:"${appName}"}`;
    console.log('properties', properties);
    return native.execApplescriptCommand(`make login item at end with properties ${properties}`);
  },
  async disable(appName: string): Promise<ChildReturnData> {
    return native.execApplescriptCommand(`delete login item \"${appName}\"`);
  },
  async isEnabled(appName: string): Promise<boolean> {
    const response: ChildReturnData = await native.execApplescriptCommand('get the name of every login item');
    const loginList = response?.stdout[0]?.split(', ') || []
    const exists = loginList.includes(appName)
    console.log('login Item Exists:', exists);
    return exists
  },

}

const winAL = {
  subKey: "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run",
  // TODO add support for hidden on windows
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async enable({ appName, appPath, minimized }: AutoLaunchParams): Promise<ChildReturnData> {
    const returnVal = <ChildReturnData>{ stdout: [], stderr: [] }
    const result = await native.winregSet(this.subKey, appName, appPath)
    if (result.search('success') > -1) {
      returnVal.stdout.push(result)
    } else {
      returnVal.stderr.push(result)
    }
    return returnVal
  },
  async disable(appName: string): Promise<ChildReturnData> {
    const returnVal = <ChildReturnData>{ stdout: [], stderr: [] }
    const result = <string>(await native.winregDelete(this.subKey, appName))
    if (result.search('success') > -1) {
      returnVal.stdout.push(result)
    } else {
      returnVal.stderr.push(result)
    }
    return returnVal
  },
  async isEnabled(appName: string): Promise<boolean> {
    const result = <string>(await native.winregGet(this.subKey, appName))
    console.log('isEnabled result:', result);
    if (result.search('The system cannot find the file specified.') > -1) {
      return false
    } else {
      return true
    }
  }
}

// TODO make class impossible to instantiate uninitialized
export class AutoLauncher {
  protected autoLauncher: osAL = nullAL
  protected appName = 'subspace-desktop'
  protected appPath = ''
  enabled = false
  async isEnabled(): Promise<boolean> {
    const result = await this.autoLauncher.isEnabled(this.appName)
    this.enabled = result
    return result
  }
  async enable(): Promise<void | ChildReturnData> {
    const child = await this.autoLauncher.enable({ appName: this.appName, appPath: this.appPath, minimized: true })
    this.enabled = await this.isEnabled()
    if (!this.enabled) {
      console.error("ENABLE DID NOT WORK")
    } else {
      appConfig.updateAppConfig(null, null, true, null, null)
    }
    return child
  }
  async disable(): Promise<void | ChildReturnData> {
    const child = this.autoLauncher.disable(this.appName)
    this.enabled = await this.isEnabled()
    if (this.enabled) {
      console.error("DISABLE DID NOT WORK")
    } else {
      appConfig.updateAppConfig(null, null, false, null, null)
    }
    return child
  }
  async init(): Promise<void> {
    this.appName = process.env.DEV ? "subspace-desktop" : (await app.getName()).toString()
    const osType = await os.type()
    console.log("OS TYPE: " + osType)
    this.appPath = await invoke('get_this_binary') as string
    console.log('get_this_binary', this.appPath);
    if (osType == 'Darwin') {
      this.autoLauncher = macAL
    } else if (osType == 'Windows_NT') {
      this.autoLauncher = winAL
      // From Windows 11 Tests: get_this_binary returns a string with a prefix "\\?\" on C:\Users......". On boot, autostart can't locate "\\?\c:\DIR\subspace-desktop.exe
      const appPath = this.appPath
      this.appPath = appPath.startsWith("\\\\?\\") ? appPath.replace("\\\\?\\", "") : appPath
    } else {
      this.autoLauncher = linAL
    }

    const config = appConfig.getAppConfig()
    if (config) {
      if (config.launchOnBoot)
      {
        // the app may be initialized before, but then user may have decided to move the app to another directory
        // in this case, we have to delete the previous autoLaunch entry, and create a new one
        await this.disable()
        await this.enable()
        this.enabled = (await this.isEnabled())
      }
    }
    // if launch preference is `false`, we don't need to do anything here, it should stay as it is
    // also, config is created before autoLauncher, so there should be a config always
  }
}
