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
    importedRewAddr: boolean | null,
    plottingStarted: boolean | null
  ): void {
    const appConfig = this.getAppConfig()
    if (appConfig) {
      const newAppConfig = appConfig
      if (plot) newAppConfig.plot = plot
      if (segmentCache) newAppConfig.segmentCache = segmentCache
      if (launchOnBoot != null) newAppConfig.launchOnBoot = launchOnBoot
      if (importedRewAddr != null) newAppConfig.importedRewAddr = importedRewAddr
      if (plottingStarted != null) newAppConfig.plottingStarted = plottingStarted
      LocalStorage.set("appConfig", newAppConfig)
    }
  }
}
