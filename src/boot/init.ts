import { boot } from 'quasar/wrappers'
import VueApexCharts from "vue3-apexcharts";
import { createI18n } from 'vue-i18n'
import * as tauriEvents from '@tauri-apps/api/event';

import messages from '../i18n'
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
  // check for newer version every day
  const DAY_MS = 24 * 60 * 60 * 1000;
  setInterval(() => tauriEvents.emit('tauri://update'), DAY_MS);
  // update app state to reflect that newer version is available
  tauriEvents.listen('tauri://update-available', globalState.setHasNewUpdate);
  await appConfig.init()
  const { nodeName } = (await appConfig.read());
  globalState.setNodeName(nodeName);
  const api = createApi(LOCAL_RPC);
  const client = new Client(api);
  const autoLauncher = new AutoLauncher();
  await autoLauncher.init();
  app.config.globalProperties.$client = client;
  app.config.globalProperties.$autoLauncher = autoLauncher;
  app.use(VueApexCharts)

  const i18n = createI18n({
    locale: 'en-US',
    messages
  });

  app.use(i18n);
})
