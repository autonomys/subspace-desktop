/* eslint-disable no-unused-vars */
import { AutoLaunchParams } from '../types'

const nullAutoLaunch = {
  enable({ appName, appPath, hidden }: AutoLaunchParams) {

  },
  disable(appName: string) {
  },
  async isEnabled(appName: string) {
  },
  execApplescriptCommand(commandSuffix: string) {
  }
}
export default nullAutoLaunch
