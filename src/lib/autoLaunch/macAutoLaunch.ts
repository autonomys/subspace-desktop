
import fileUtils from './fileUtils'
import * as native from '../native'
interface AutoLaunchParams { appName: string, appPath: string, hidden: boolean }
import * as applescript from "src/lib/osUtils/applescript"
const macAutoLaunch = {

  enable({ appName, appPath, hidden }: AutoLaunchParams) {
    const isHiddenValue = hidden ? 'true' : 'false';
    const properties = `{path:\"${appPath}\", hidden:${isHiddenValue}, name:\"${appName}\"}`;
    console.log('properties', properties);

    return this.execApplescriptCommand(`make login item at end with properties ${properties}`);
  },
  disable(appName: string) {
    return this.execApplescriptCommand(`delete login item \"${appName}\"`);
  },
  isEnabled(appName: string) {
    return this.execApplescriptCommand('get the name of every login item').then((loginItems: any) => (loginItems != null) && Array.from(loginItems).includes(appName));
  },
  execApplescriptCommand(commandSuffix) {
    const result = applescript.execString(`tell application \"System Events\" to ${commandSuffix}`)
    return result
  }
}
export default macAutoLaunch