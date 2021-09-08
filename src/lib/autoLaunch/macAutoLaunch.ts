
import fileUtils from './fileUtils'
import * as native from '../native'

module.exports = {

  enable({ appName, appPath, isHiddenOnLaunch, mac }) {
    if (mac.useLaunchAgent) {
      const programArguments = [appPath];
      if (isHiddenOnLaunch) { programArguments.push('--hidden'); }
      const programArgumentsSection = programArguments
        .map(argument => `    <string>${argument}</string>`)
        .join('\n');

      const data = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${appName}</string>
  <key>ProgramArguments</key>
  <array>
  ${programArgumentsSection}
  </array>
  <key>RunAtLoad</key>
  <true/>
</dict>
</plist>`;

      return fileUtils.createFile({
        data,
        directory: this.getDirectory(),
        filePath: this.getFilePath(appName)
      });
    }

    // Otherwise, use default method; use AppleScript to tell System Events to add a Login Item
    const isHiddenValue = isHiddenOnLaunch ? 'true' : 'false';
    const properties = `{path:\"${appPath}\", hidden:${isHiddenValue}, name:\"${appName}\"}`;

    return this.execApplescriptCommand(`make login item at end with properties ${properties}`);
  },
  disable(appName, mac) {
    // Delete the file if we're using a Launch Agent
    if (mac.useLaunchAgent) { return fileUtils.removeFile(this.getFilePath(appName)); }

    // Otherwise remove the Login Item
    return this.execApplescriptCommand(`delete login item \"${appName}\"`);
  },
  isEnabled(appName, mac) {
    // Check if the Launch Agent file exists
    if (mac.useLaunchAgent) { return fileUtils.isEnabled(this.getFilePath(appName)); }

    // Otherwise check if a Login Item exists for our app
    return this.execApplescriptCommand('get the name of every login item').then(loginItems => (loginItems != null) && Array.from(loginItems).includes(appName));
  },

  execApplescriptCommand(commandSuffix) {
    const result = native.execString(`tell application \"System Events\" to ${commandSuffix}`)
    return result
  },
  getDirectory() { return '~/Library/LaunchAgents/'; },
  getFilePath(appName) { return `${this.getDirectory()}${appName}.plist`; }
};