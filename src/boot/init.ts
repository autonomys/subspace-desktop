import { boot } from 'quasar/wrappers'
import { data as gData, mutations as gMut } from "src/lib/global"
import * as global from 'src/lib/global'
import VueApexCharts from "vue3-apexcharts";

export default boot(async ({ app, router }) => {
  await gMut.loadLangData()
  // gMut.initClient()
  gMut.initLaunchOnBoot()
  app.config.globalProperties.$txt = global.data.loc.text
  app.use(VueApexCharts)

})
