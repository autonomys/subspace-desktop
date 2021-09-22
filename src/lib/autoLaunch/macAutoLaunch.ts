
import { AutoLaunchParams, ChildReturnData } from '../types'
import * as native from '../native'

const macAutoLaunch = {
  async enable({ appName, appPath, hidden }: AutoLaunchParams): Promise<ChildReturnData> {
    const isHiddenValue = hidden ? 'true' : 'false';
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
export default macAutoLaunch
