import { boot } from 'quasar/wrappers'
import VueApexCharts from "vue3-apexcharts";
import { globalState } from "../lib/global"
import { Client } from "../lib/client"
import { createApi } from '../lib/util';
import { AutoLauncher } from "../lib/autoLauncher"

const LOCAL_RPC = process.env.LOCAL_API_WS || "ws://localhost:9944"

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
  const api = createApi(LOCAL_RPC);
  const client = new Client(api);
  const autoLauncher = new AutoLauncher();
  await autoLauncher.init();
  app.config.globalProperties.$client = client;
  app.config.globalProperties.$autoLauncher = autoLauncher;
  app.use(VueApexCharts)
})
