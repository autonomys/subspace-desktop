import { LocalStorage } from "quasar"
import { Account, AppConfig, Plot, emptyAppConfig, SegmentCache } from "./util"

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
    account: Account | null,
    segmentCache: SegmentCache | null,
    launchOnBoot: boolean | null
  ): void {
    const appConfig = this.getAppConfig()
    if (appConfig) {
      const newAppConfig = appConfig
      if (plot) newAppConfig.plot = plot
      if (account) newAppConfig.account = account
      if (segmentCache) newAppConfig.segmentCache = segmentCache
      if (launchOnBoot) newAppConfig.launchOnBoot = launchOnBoot
      LocalStorage.set("appConfig", newAppConfig)
    }
  }
}
