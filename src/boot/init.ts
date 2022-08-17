import { boot } from 'quasar/wrappers';
import VueApexCharts from 'vue3-apexcharts';
import { createI18n } from 'vue-i18n';
import * as tauriEvents from '@tauri-apps/api/event';

import * as tauri from '@tauri-apps/api';

import messages from '../i18n';
import { Client } from '../lib/client';
import { createApi } from '../lib/util';
import AutoLauncher, { MacOSAutoLauncher, LinuxAutoLauncher, WindowsAutoLauncher } from '../lib/autoLauncher';
import Config from '../lib/config';
import { useStore } from '../stores/store';
import { appName, errorLogger, infoLogger } from '../lib/util';
import * as native from '../lib/native';

const LOCAL_RPC = process.env.LOCAL_API_WS || 'ws://localhost:9947';

declare module '@vue/runtime-core' {
  export interface ComponentCustomProperties {
    $client: Client;
    $autoLauncher: AutoLauncher;
    $config: Config;
  }
}

export default boot(async ({ app }) => {
  // check for newer version every day
  const DAY_MS = 24 * 60 * 60 * 1000;
  setInterval(() => tauriEvents.emit('tauri://update'), DAY_MS);
  // update app state to reflect that newer version is available
  tauriEvents.listen('tauri://update-available', globalState.setHasNewUpdate);
  // create Config instance and initialize it
  const configDir = await tauri.path.configDir();
  const config = new Config({ fs: tauri.fs, appName, configDir, errorLogger });
  await config.init();

  // set node name from config (empty string is default value)
  const { nodeName } = (await config.readConfigFile());
  const store = useStore();
  store.setNodeName(config, nodeName);

  // create Client instance
  const api = createApi(LOCAL_RPC);
  const client = new Client({ api, config });

  // create AutoLauncher instance and initialize it 
  const osType = await tauri.os.type();
  infoLogger('OS TYPE: ' + osType);
  const appPath = await tauri.invoke('get_this_binary') as string; // this is not the same as appDir: appPath -> appDir
  infoLogger('get_this_binary : ' + appPath);

  let osAutoLauncher;

  if (osType === 'Darwin') {
    osAutoLauncher = new MacOSAutoLauncher({ appName, appPath, native });
  } else if (osType === 'Windows_NT') {
    // From Windows 11 Tests: get_this_binary returns a string with a prefix "\\?\" on C:\Users......". On boot, autostart can't locate "\\?\c:\DIR\subspace-desktop.exe
    const winAppPath = appPath.startsWith('\\\\?\\') ? appPath.replace('\\\\?\\', '') : appPath;
    osAutoLauncher = new WindowsAutoLauncher({ appPath: winAppPath, appName, native });
  } else {
    osAutoLauncher = new LinuxAutoLauncher({ appName, appPath, configDir, fs: tauri.fs });
  }

  const autoLauncher = new AutoLauncher({ config, osAutoLauncher });
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
