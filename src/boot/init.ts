import { boot } from 'quasar/wrappers'
import VueApexCharts from "vue3-apexcharts";
import { globalState } from "../lib/global"

export default boot(async ({ app }) => {
  const initActions = [
    globalState.init()
  ]
  await Promise.all(initActions)
  app.config.globalProperties.$txt = globalState.data.loc.text
  app.use(VueApexCharts)
})
