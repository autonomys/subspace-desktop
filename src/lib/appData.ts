import * as fs from "@tauri-apps/api/fs"
import * as path from "@tauri-apps/api/path"
import { Dialog, DialogChainObject } from "quasar"
import { appName, Plot } from "./util"

export interface ConfigFile {
  [index: string]: any
  plot: Plot
  rewardAddress: string,
  launchOnBoot: boolean,
  version: string
}

const emptyConfig: ConfigFile = {
  plot: { location: "", sizeGB: 0 },
  rewardAddress: "",
  launchOnBoot: true,
  version: ""
}

export const appConfig = {
  async configDir(): Promise<string> {
    return (await path.configDir()) + appName
  },
  async configFullPath(): Promise<string> {
    return (await path.configDir()) + appName + "/" + appName + ".cfg"
  },
  async init(): Promise<void> {
    try {
      await this.read()
    } catch {
      // means there were no config file
      await fs.createDir(await this.configDir()).catch((error) => {
        if (!error.includes("exists")) {
          console.error(error)
        }
      });
      await this.write(emptyConfig)
    }
  },
  validate(config: ConfigFile): boolean {
    const { plot, rewardAddress } = config
    if (
      plot.location.length > 0 &&
      plot.sizeGB > 0 &&
      rewardAddress.length > 0
    ) {
      return true
    }
    return false
  },
  async remove(): Promise<void> {
    await fs.removeFile(await this.configFullPath()).catch(console.error)
  },

  async read(): Promise<ConfigFile> {
    const result = await fs.readTextFile(await this.configFullPath())
    const config: ConfigFile = JSON.parse(result)
    return config
  },
  async write(config: ConfigFile): Promise<void> {
    await fs.createDir(await this.configDir()).catch((error) => {
      if (!error.includes("exists")) {
        console.error(error)
      }
    });
    await fs.writeFile({
        path: await this.configFullPath(),
        contents: JSON.stringify(config, null, 2)
      })
      .catch(console.error)
  },
  async update(
    plot: Plot | null,
    rewardAddress: string | null,
    launchOnBoot: boolean | null,
    version: string | null
  ): Promise<void> {
    const newAppConfig = await this.read()
    if (plot) newAppConfig.plot = plot
    if (launchOnBoot != null) newAppConfig.launchOnBoot = launchOnBoot
    if (rewardAddress) newAppConfig.rewardAddress = rewardAddress
    if (version) newAppConfig.version = version
    this.write(newAppConfig)
  },
  showErrorModal(): DialogChainObject {
    // TODO: refactor this!
    return Dialog.create({ message: "Config file is corrupted, resetting..." })
  }
}

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
