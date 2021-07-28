export const setPassword = {
  pageTitle: "Setup Password",
  infoDialog: `
  This password will be used to encrypt your keys.
  If you lose your password then the only way to recover your account is to re-import your private keys.
  `,
  securePassword: "Secure Password",
  confirmPassword: "Confirm Password",
  pwError1: "Password is too short",
  pwError2: "Passwords don't match",
  pwSuccess: "Password is valid",
  tooltip: "Please enter a valid password to continue"
}
export const saveKeys = {
  pageTitle: "Backup Private Key",
  confirmMsg: `
  I have backed up my private key. I understand that my account can't be recovered without my private key.
  `,
  tooltip: "Please confirm you have backed up your private key first",
  yourPrivateKey: "Your private key",
  userConfirm: "I have backed up my private key."
}
export const setupPlot = {
  pageTitle: "Setup Plots",
  infoDialog: "Subspace needs a place to store data files (Plots).",
  tooltip: "You must allocate at least 100 GB for plots to continue."

}
export const plottingProgress = {
  pageTitle: "Initial Plotting",
  infoDialog: "This is a one-time process to prepare this device as a Subspace farmer."
}