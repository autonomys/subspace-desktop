import { boot } from 'quasar/wrappers'
import { data as gData, mutations as gMut } from "src/lib/global"
import * as global from 'src/lib/global'
export default boot(async ({ app, router }) => {
  app.config.globalProperties.$txt = global.data.loc.text
  await gMut.loadLangData()
})
