
// const regKey = new Winreg({
//     hive: Winreg.HKCU,
//     key:  '\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'
// });
// path = require 'path'
import path from 'path'
import * as native from '../native'
import { AutoLaunchParams } from '../types'

module.exports = {

  enable({ appName, appPath, hidden }: AutoLaunchParams) {
    // return new Promise(function (resolve, reject) {
    //   let pathToAutoLaunchedApp = appPath;
    //   let args = '';
    //   const updateDotExe = path.join(path.dirname(process.execPath), '..', 'update.exe');

    //   if (((process.versions != null ? process.versions.electron : undefined) != null) && native.dirExists(updateDotExe)) {
    //     pathToAutoLaunchedApp = updateDotExe;
    //     args = ` --processStart \"${path.basename(process.execPath)}\"`;
    //     if (isHiddenOnLaunch) { args += ' --process-start-args "--hidden"'; }
    //   } else {
    //     if (isHiddenOnLaunch) { args += ' --hidden'; }
    //   }

    //   return regKey.set(appName, Winreg.REG_SZ, `\"${pathToAutoLaunchedApp}\"${args}`, function (err) {
    //     if (err != null) { return reject(err); }
    //     return resolve();
    //   });
    // });
  },
  disable(appName: string) {
    // return new Promise((resolve, reject) => regKey.remove(appName, function (err) {
    //   if (err != null) {
    //     // The registry key should exist but in case it fails because it doesn't exist, resolve false instead
    //     // rejecting with an error
    //     if (err.message.indexOf('The system was unable to find the specified registry key or value') !== -1) {
    //       return resolve(false);
    //     }
    //     return reject(err);
    //   }
    //   return resolve();
    // }));
  },



  isEnabled(appName: string) {
    // return new Promise((resolve, reject) => regKey.get(appName, function (err, item) {
    //   if (err != null) { return resolve(false); }
    //   return resolve(item != null);
    // }));
  }
};
