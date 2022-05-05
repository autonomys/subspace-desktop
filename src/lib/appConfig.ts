import { Dialog, DialogChainObject } from "quasar"
import { appName } from "./util"
import * as path from "@tauri-apps/api/path"
import * as fs from "@tauri-apps/api/fs"

export interface SegmentCache {
  networkSegmentCount: number
  blockchainSizeGB: number
}
export interface Plot {
  location: string
  sizeGB: number
}

interface Config {
  [index: string]: any
  plot: Plot
  rewardAddress: string,
  launchOnBoot: boolean,
  version: string,

  // TODO: remove this after PlottingProgress refactoring
  segmentCache: SegmentCache,
}

const emptyConfig: Config = {
  plot: { location: "", sizeGB: 0 },
  rewardAddress: "",
  launchOnBoot: true,
  version: process.env.APP_VERSION || "?",
  segmentCache: { networkSegmentCount: 0, blockchainSizeGB: 0 },
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
  validate(config: Config): boolean {
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

  async read(): Promise<Config> {
    const result = await fs.readTextFile(await this.configFullPath())
    const config: Config = JSON.parse(result)
    return config
  },
  async write(config: Config): Promise<void> {
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
    {
      plot = null,
      launchOnBoot = null,
      rewardAddress = null,
      version = null,
      segmentCache = null,
    }: {
      plot?: Plot | null;
      launchOnBoot?: boolean | null;
      rewardAddress?: string | null;
      version?: string | null;
      segmentCache?: SegmentCache | null;
    }
  ): Promise<void> {
    const newAppConfig = await this.read()
    if (plot) newAppConfig.plot = plot
    if (launchOnBoot != null) newAppConfig.launchOnBoot = launchOnBoot
    if (rewardAddress) newAppConfig.rewardAddress = rewardAddress
    if (version) newAppConfig.version = version
    if (segmentCache) newAppConfig.segmentCache = segmentCache
    this.write(newAppConfig)
  },
  showErrorModal(): DialogChainObject {
    // TODO: refactor this!
    return Dialog.create({ message: "Config file is corrupted, resetting..." })
  }
}
