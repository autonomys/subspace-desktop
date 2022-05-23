import { boot } from 'quasar/wrappers'
import VueApexCharts from "vue3-apexcharts";
import { globalState } from "../lib/global"
import { Client } from "../lib/client"
import { createApi } from '../lib/util';
import { AutoLauncher } from "../lib/autoLauncher"
import { appConfig } from "../lib/appConfig";

const LOCAL_RPC = process.env.LOCAL_API_WS || "ws://localhost:9947"

declare module "@vue/runtime-core" {
  export interface ComponentCustomProperties {
    $client: Client;
    $autoLauncher: AutoLauncher;
  }
}

export default boot(async ({ app }) => {
  await appConfig.init()
  const { nodeName } = (await appConfig.read());
  globalState.setNodeName(nodeName);
  await globalState.loadLangData()
  const api = createApi(LOCAL_RPC);
  const client = new Client(api);
  const autoLauncher = new AutoLauncher();
  await autoLauncher.init();
  app.config.globalProperties.$client = client;
  app.config.globalProperties.$autoLauncher = autoLauncher;
  app.use(VueApexCharts)
})
