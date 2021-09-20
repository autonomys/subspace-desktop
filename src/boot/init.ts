import { boot } from 'quasar/wrappers'
import { globalState } from "src/lib/global"
import * as global from 'src/lib/global'
import VueApexCharts from "vue3-apexcharts";

export default boot(async ({ app, router }) => {
  const initActions = [
    globalState.init()
  ]
  await Promise.all(initActions)
  app.config.globalProperties.$txt = globalState.data.loc.text
  app.use(VueApexCharts)

})
