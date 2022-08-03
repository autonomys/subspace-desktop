import { boot } from 'quasar/wrappers';
import VueApexCharts from 'vue3-apexcharts';
import { createI18n } from 'vue-i18n';
import messages from '../i18n';
import { Client } from '../lib/client';
import { createApi } from '../lib/util';
import { AutoLauncher } from '../lib/autoLauncher';
import { config } from '../lib/appConfig';
import { useStore } from '../stores/store';

const LOCAL_RPC = process.env.LOCAL_API_WS || 'ws://localhost:9947';

declare module '@vue/runtime-core' {
  export interface ComponentCustomProperties {
    $client: Client;
    $autoLauncher: AutoLauncher;
  }
}

export default boot(async ({ app }) => {
  await config.init();
  const { nodeName } = (await config.read());
  const store = useStore();
  store.setNodeName(config, nodeName);
  const api = createApi(LOCAL_RPC);
  const client = new Client(api);
  const autoLauncher = new AutoLauncher();
  await autoLauncher.init();
  app.config.globalProperties.$client = client;
  app.config.globalProperties.$autoLauncher = autoLauncher;
  app.use(VueApexCharts);

  const i18n = createI18n({
    locale: 'en-US',
    messages
  });

  app.use(i18n);
});
