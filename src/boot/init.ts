import { boot } from 'quasar/wrappers'
import { data as gData, mutations as gMut } from "src/lib/global"

export default boot(async (/* { app, router, ... } */) => {
  await gMut.loadLangData()
})
