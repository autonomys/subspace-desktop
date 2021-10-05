import * as app from "@tauri-apps/api/app"
import * as os from "@tauri-apps/api/os"
import { invoke } from '@tauri-apps/api/tauri'
import { AutoLaunchParams, ChildReturnData } from './types'
import * as fs from "@tauri-apps/api/fs"
import * as native from './native'


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
    const response: ChildReturnData = { stderr: [], stdout: [] }
    const hiddenArg = minimized ? ' --minimized' : '';

    const contents = `
[Desktop Entry]
Type=Application
Version=1.0
Name=${appName}
Comment=${appName}startup script
Exec=${appPath}${hiddenArg}
StartupNotify=false
Terminal=false
  `
    await fs.createDir(this.getDirectory()).catch(console.error)
    await fs.writeFile({ contents, path: this.getFilePath(appName) })
    response.stdout.push('success')
    return response
  },
  async disable(appName: string): Promise<ChildReturnData> {
    const response: ChildReturnData = { stderr: [], stdout: [] }
    await fs.removeFile(this.getFilePath(appName))
    response.stdout.push("success")
    return response
  },
  async isEnabled(appName: string): Promise<boolean> {
    try {
      await fs.readTextFile(this.getFilePath(appName))
      return true
    } catch (error) {
      console.error(error)
      return false
    }
  },
  getDirectory(): string { return '~/.config/autostart/'; },
  getFilePath(appName: string): string { return `${this.getDirectory()}${appName}.desktop`; }
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
  protected appName = 'app'
  protected appPath = ''
  enabled = false
  async isEnabled(): Promise<boolean> {
    const result = await this.autoLauncher.isEnabled(this.appName)
    this.enabled = result
    return result
  }
  async enable(): Promise<void | ChildReturnData> {
    const child = await this.autoLauncher.enable({ appName: this.appName, appPath: this.appPath, minimized: false })
    return child
  }
  async disable(): Promise<void | ChildReturnData> {
    const child = this.autoLauncher.disable(this.appName)
    return child
  }
  async init(): Promise<void> {
    this.appName = process.env.DEV ? "app" : (await app.getName()).toString()
    const osType = await os.type()
    this.appPath = await invoke('get_this_binary') as string
    console.log('get_this_binary', this.appPath);
    console.log(this.appPath);
    if (osType == 'Darwin') this.autoLauncher = macAL
    else if (osType == 'Windows_NT') this.autoLauncher = winAL
    else this.autoLauncher = linAL
    this.enabled = (await this.isEnabled())
  }
}
