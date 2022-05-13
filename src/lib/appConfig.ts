import { LocalStorage } from "quasar"
import { AppConfig, Plot, emptyAppConfig, SegmentCache } from "./util"

export const appConfig = {
  initAppConfig(): void {
    if(!this.getAppConfig())
      LocalStorage.set("appConfig", emptyAppConfig)
  },
  getAppConfig(): AppConfig | void {
    const appConfig = LocalStorage.getItem("appConfig")
    if (appConfig) return appConfig as AppConfig
  },
  updateAppConfig(
    plot: Plot | null,
    segmentCache: SegmentCache | null,
    launchOnBoot: boolean | null,
    rewardAddress: string | null,
    plottingStarted: boolean | null
  ): void {
    const appConfig = this.getAppConfig()
    if (appConfig) {
      const newAppConfig = appConfig
      if (plot != null) newAppConfig.plot = plot
      if (segmentCache != null) newAppConfig.segmentCache = segmentCache
      if (launchOnBoot != null) newAppConfig.launchOnBoot = launchOnBoot
      if (rewardAddress != null) newAppConfig.rewardAddress = rewardAddress
      if (plottingStarted != null) newAppConfig.plottingStarted = plottingStarted
      LocalStorage.set("appConfig", newAppConfig)
    }
  }
}
