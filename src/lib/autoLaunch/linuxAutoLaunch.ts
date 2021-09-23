
module.exports = {

  //   enable({ appName, appPath, isHiddenOnLaunch }) {
  //     const hiddenArg = isHiddenOnLaunch ? ' --hidden' : '';

  //     const data = `[Desktop Entry]
  // Type=Application
  // Version=1.0
  // Name=${appName}
  // Comment=${appName}startup script
  // Exec=${appPath}${hiddenArg}
  // StartupNotify=false
  // Terminal=false`;

  //     // return fileUtils.createFile({
  //     //   data,
  //     //   directory: this.getDirectory(),
  //     //   filePath: this.getFilePath(appName)
  //     // });
  //   },

  //   disable(appName) { return fileUtils.removeFile(this.getFilePath(appName)); },

  //   isEnabled(appName) { return fileUtils.isEnabled(this.getFilePath(appName)); },

  //   getDirectory() { return '~/.config/autostart/'; },
  //   getFilePath(appName) { return `${this.getDirectory()}${appName}.desktop`; }
};
