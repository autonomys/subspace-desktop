import { boot } from 'quasar/wrappers'
import VueApexCharts from "vue3-apexcharts";
import { globalState } from "../lib/global"
import { Client } from "../lib/client"
import { createApi } from '../lib/util';
import { NETWORK_RPC, LOCAL_RPC } from '../lib/appConfig';
import { AutoLauncher } from "../lib/autoLauncher"

declare module "@vue/runtime-core" {
  export interface ComponentCustomProperties {
    $client: Client;
    $autoLauncher: AutoLauncher;
  }
}

export default boot(async ({ app }) => {
  const initActions = [
    globalState.init()
  ]
  await Promise.all(initActions)
  const publicApi = createApi(NETWORK_RPC);
  const localApi = createApi(LOCAL_RPC);
  const client = new Client(localApi, publicApi);
  const autoLauncher = new AutoLauncher();
  await autoLauncher.init();
  app.config.globalProperties.$client = client;
  app.config.globalProperties.$autoLauncher = autoLauncher;
  app.use(VueApexCharts)
})
