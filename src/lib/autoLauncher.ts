import * as app from "@tauri-apps/api/app"
import * as os from "@tauri-apps/api/os"
import { invoke } from '@tauri-apps/api/tauri'
import { AutoLaunchParams, ChildReturnData } from './types'
import * as fs from "@tauri-apps/api/fs"
import * as native from './native'
import * as path from "@tauri-apps/api/path"

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
    const autostartAppFile = await this.getAutostartFilePath(appName)
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
  async getAutostartFilePath(appName:string): Promise<string> {
    const autostartDirectory = (await path.configDir()) + "/autostart"
    const autostartAppFile = autostartDirectory + "/" + appName + ".desktop"
    return autostartAppFile
  }
}

const macAL = {
  async enable({ appName, appPath, minimized }: AutoLaunchParams): Promise<ChildReturnData> {
    const isHiddenValue = minimized ? 'true' : 'false';
    const properties = `{path:"${appPath}", hidden:${isHiddenValue}, name:"${appName}"}`;
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
    if (result.search('success') > -1) returnVal.stdout.push(result)
    else returnVal.stderr.push(result)
    return returnVal
  },
  async disable(appName: string): Promise<ChildReturnData> {
    const returnVal = <ChildReturnData>{ stdout: [], stderr: [] }
    const result = <string>(await native.winregDelete(this.subKey, appName))
    if (result.search('success') > -1) returnVal.stdout.push(result)
    else returnVal.stderr.push(result)
    return returnVal
  },
  async isEnabled(appName: string): Promise<boolean> {
    const result = <string>(await native.winregGet(this.subKey, appName))
    console.log('isEnabled result:', result);
    if (result.search('The system cannot find the file specified.') > -1) return false
    else return true
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
    return child
  }
  async disable(): Promise<void | ChildReturnData> {
    const child = this.autoLauncher.disable(this.appName)
    return child
  }
  async init(): Promise<void> {
    this.appName = process.env.DEV ? "subspace-desktop" : (await app.getName()).toString()
    const osType = await os.type() // this is returning "Darwing" for macos.
    console.log("OS TYPE: " + osType)
    this.appPath = await invoke('get_this_binary') as string
    console.log('get_this_binary', this.appPath);
    if (osType.includes('Darwin')) this.autoLauncher = macAL // TODO: check when upgrade tauri
    // and if it is returning `Darwin`, change it back to `osType == 'Darwin'` instead of `includes`
    else if (osType == 'Windows_NT') this.autoLauncher = winAL
    else this.autoLauncher = linAL

    await this.enable() // make it enable launch on boot as default choice
    this.enabled = (await this.isEnabled())
  }
}
