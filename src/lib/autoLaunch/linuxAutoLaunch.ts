import { AutoLaunchParams, ChildReturnData } from '../types'
import * as native from '../native'
import * as fs from "@tauri-apps/api/fs"

const linuxAutoLaunch = {

  async enable({ appName, appPath, hidden }: AutoLaunchParams): Promise<ChildReturnData> {
    const response: ChildReturnData = { stderr: [], stdout: [] }
    const hiddenArg = hidden ? ' --hidden' : '';

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
export default linuxAutoLaunch
