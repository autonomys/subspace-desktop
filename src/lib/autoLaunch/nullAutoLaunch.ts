/* eslint-disable @typescript-eslint/no-unused-vars */
import { AutoLaunchParams, ChildReturnData } from '../types'

const nullAutoLaunch = {
  async enable({ appName, appPath, hidden }: AutoLaunchParams): Promise<ChildReturnData> {
    return { stdout: [], stderr: [] }
  },
  async disable(appName: string): Promise<ChildReturnData> {
    return { stdout: [], stderr: [] }
  },
  async isEnabled(appName: string): Promise<boolean> {
    return false
  }
}
export default nullAutoLaunch
