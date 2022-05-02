import { LocalStorage } from "quasar"
import { OldAppConfig, Plot, emptyAppConfig, SegmentCache } from "./util"

export const oldAppConfig = {
  initAppConfig(): void {
    if(!this.getAppConfig())
      LocalStorage.set("appConfig", emptyAppConfig)
  },
  getAppConfig(): OldAppConfig | void {
    const appConfig = LocalStorage.getItem("appConfig")
    if (appConfig) return appConfig as OldAppConfig
  },
  updateAppConfig(
    plot: Plot | null,
    segmentCache: SegmentCache | null,
    launchOnBoot: boolean | null,
    rewardAddress: string | null
  ): void {
    const appConfig = this.getAppConfig()
    if (appConfig) {
      const newAppConfig = appConfig
      if (plot) newAppConfig.plot = plot
      if (segmentCache) newAppConfig.segmentCache = segmentCache
      if (launchOnBoot != null) newAppConfig.launchOnBoot = launchOnBoot
      if (rewardAddress) newAppConfig.rewardAddress = rewardAddress
      LocalStorage.set("appConfig", newAppConfig)
    }
  }
}
