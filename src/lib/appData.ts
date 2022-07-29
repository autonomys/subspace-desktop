import * as fs from "@tauri-apps/api/fs"
import { Dialog } from "quasar"
import { config } from "./appConfig"
import { errorLogger } from "./util"


export const appData = {
  async getDataDirPath(): Promise<string> {
    const { plot } = await config.read()
    return plot.location
  },
  async clearDataDir(): Promise<void> {
    const dataDir = await this.getDataDirPath()
    if (dataDir === "") return
    await fs.removeDir(dataDir, { recursive: true }).catch((error) => {
      errorLogger(error)
    })
  },
  async createCustomDataDir(location: string): Promise<void> {
    await fs.createDir(location).catch((error) => {
      errorLogger(error)
    })
  },
}

export const appDataDialog = {
  notEmptyDirectoryInfo(plotDirectory: string): void {
    Dialog.create({
      title: `Selected directory is not empty!`,
      // TODO: the styling below is not applied due to CSP. Make it NOT inline, or abandon it
      message: `
        <p style="font-size:12px;">
          Plots Directory must be empty.</br>
        </p>
        <p style="font-size:14px; color: orange">
          <b>${plotDirectory}</b>
        </p>
      `,
      html: true,
      dark: true,
      ok: { label: "Close", icon: "close", flat: true, color: "gray" }
    })
  },
  newDirectoryConfirm(
    plotDirectory: string,
    prepareForPlotting: () => Promise<void>
  ): void {
    Dialog.create({
      title: `Do you want to create a new directory?`,
      // TODO: the styling below is not applied due to CSP. Make it NOT inline, or abandon it
      message: `
        <p style="font-size:12px;">
          A new directory will be created.</br>
        </p>
        <p style="font-size:14px; color: #2196f3">
          <b>${plotDirectory}</b>
        </p>
      `,
      html: true,
      dark: true,
      ok: { label: "Create", icon: "check", flat: true, color: "blue" },
      cancel: { label: "Cancel", icon: "cancel", flat: true, color: "grey" }
    }).onOk(() => {
      prepareForPlotting()
    })
  },
  existingDirectoryConfirm(
    plotDirectory: string,
    prepareForPlotting: () => Promise<void>
  ): void {
    Dialog.create({
      title: `Confirm selected directory.`,
      // TODO: the styling below is not applied due to CSP. Make it NOT inline, or abandon it
      message: `
        <p style="font-size:12px;">
          Selected plot directory.</br>
        </p>
        <p style="font-size:14px; color: #2196f3">
          <b>${plotDirectory}</b>
        </p>
      `,
      html: true,
      dark: true,
      ok: {
        label: "Confirm",
        icon: "check",
        flat: true,
        color: "blue"
      },
      cancel: {
        label: "Cancel",
        icon: "cancel",
        flat: true,
        color: "grey"
      }
    }).onOk(() => {
      prepareForPlotting()
    })
  }
}
