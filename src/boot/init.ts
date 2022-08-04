import { boot } from 'quasar/wrappers';
import VueApexCharts from 'vue3-apexcharts';
import { createI18n } from 'vue-i18n';
import { fs, path } from '@tauri-apps/api';

import messages from '../i18n';
import { Client } from '../lib/client';
import { createApi } from '../lib/util';
import { AutoLauncher } from '../lib/autoLauncher';
import Config from '../lib/config';
import { useStore } from '../stores/store';
import { appName, errorLogger } from '../lib/util';

const LOCAL_RPC = process.env.LOCAL_API_WS || 'ws://localhost:9947';

declare module '@vue/runtime-core' {
  export interface ComponentCustomProperties {
    $client: Client;
    $autoLauncher: AutoLauncher;
    $config: Config;
  }
}

export default boot(async ({ app }) => {
  // create Config instance and initialize it
  const appDir = await path.configDir();
  const config = new Config({ fs, appName, appDir, errorLogger });
  await config.init();

  // set node name from config (empty string is default value)
  const { nodeName } = (await config.readConfigFile());
  const store = useStore();
  store.setNodeName(config, nodeName);

  // create Client instance
  const api = createApi(LOCAL_RPC);
  const client = new Client({ api, config });

  // create AutoLauncher instance and initialize it 
  const autoLauncher = new AutoLauncher(config);
  await autoLauncher.init();

  // make client, autoLauncher and config available as global props
  app.config.globalProperties.$client = client;
  app.config.globalProperties.$autoLauncher = autoLauncher;
  app.config.globalProperties.$config = config;

  app.use(VueApexCharts);

  // include I18n instance for internationalization
  const i18n = createI18n({ locale: 'en-US', messages });
  app.use(i18n);
});
