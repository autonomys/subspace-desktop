import { AutoLaunchParams, ChildReturnData } from '../types'
import * as native from '../native'

const subKey = "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run"

const winAutoLaunch = {
  // eslint-disable-next-line no-unused-vars
  async enable({ appName, appPath, hidden }: AutoLaunchParams): Promise<ChildReturnData> {
    let returnVal = <ChildReturnData>{ stdout: [], stderr: [] }
    const result = await native.winregSet(subKey, appName, appPath)
    if (result.search('success') > -1) returnVal.stdout.push(result)
    else returnVal.stderr.push(result)
    return returnVal
  },
  async disable(appName: string): Promise<ChildReturnData> {
    let returnVal = <ChildReturnData>{ stdout: [], stderr: [] }
    const result = <string>(await native.winregDelete(subKey, appName))
    if (result.search('success') > -1) returnVal.stdout.push(result)
    else returnVal.stderr.push(result)
    return returnVal
  },
  async isEnabled(appName: string): Promise<boolean> {
    const result = <string>(await native.winregGet(subKey, appName))
    console.log('isEnabled result:', result);
    if (result.search('The system cannot find the file specified.') > -1) return false
    else return true
  }
}
export default winAutoLaunch
