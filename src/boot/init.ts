import { boot } from 'quasar/wrappers'
import VueApexCharts from "vue3-apexcharts";
import { globalState } from "../lib/global"
import { Client } from "../lib/client"
import { createApi } from '../lib/util';
import { NETWORK_RPC, LOCAL_RPC } from '../lib/appConfig';

declare module "@vue/runtime-core" {
  export interface ComponentCustomProperties {
    $client: Client;
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
  app.config.globalProperties.$client = client;
  app.use(VueApexCharts)
})
