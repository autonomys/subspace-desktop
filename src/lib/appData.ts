import * as fs from "@tauri-apps/api/fs"
import { Dialog } from "quasar"
import { appConfig } from "./appConfig"


export const appData = {
  async getDataDirPath(): Promise<string> {
    const config = await appConfig.read()
    return config.plot.location
  },
  async clearDataDir(): Promise<void> {
    const dataDir = await this.getDataDirPath()
    if (dataDir === "") return
    await fs.removeDir(dataDir, { recursive: true }).catch(console.error)
  },
  async createCustomDataDir(location: string): Promise<void> {
    await fs.createDir(location).catch(console.error)
  },
}

export const appDataDialog = {
  emptyDirectoryInfo(plotDirectory: string): void {
    Dialog.create({
      title: `Selected directory is not empty!`,
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
      message: `
    <p style="font-size:12px;">
      Seleted plot directory.</br>
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
