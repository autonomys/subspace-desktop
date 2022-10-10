<template lang="pug">
q-page(padding)
  .q-ma-xl
    .row.no-wrap.items-center.q-ma-xl.q-pt-lg
      .text-h1.q-pr-lg 👩‍🌾
      .column
        .text-h5.q-pb-md {{ $t('index.pageTitle') }}
        p {{ $t('index.subtitle') }}
  .row.justify-center.q-mt-xl
    q-btn(
      :label="$t('index.quickStart')"
      @click="viewDisclaimer('setupPlot')"
      outline
      size="md"
      no-caps
    )
  .row.justify-center.q-pt-md.q-pb-sm
    p — or —
  .row.justify-center
    q-btn(
      :label="$t('index.advanced')"
      @click="viewDisclaimer('importKey')"
      color="grey"
      flat
      no-caps
    )
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { Notify } from 'quasar';

import disclaimer from '../components/disclaimer.vue';
import { useStore } from '../stores/store';
import * as util from '../lib/util';
import * as blockStorage from '../lib/blockStorage';

export default defineComponent({
  setup() {
    const store = useStore();
    return { store };
  },
  async mounted() {
    try {
      this.checkDevAndDisableContextMenu();
      if (await this.$config.validate()) {
        this.$tauri.infoLogger('INDEX | NOT First Time RUN.');
        await this.store.updateFromConfig(blockStorage, this.$tauri);
        this.dashboard();
        return;
      }
      this.$tauri.infoLogger('validate failed, we should start from scratch');
      this.firstLoad();
    } catch (e) {
      this.$tauri.infoLogger('config could not be read, starting from scratch');
      this.firstLoad();
    }
  },
  methods: {
    checkDevAndDisableContextMenu() {
      if (util.CONTEXT_MENU === 'OFF')
        document.addEventListener('contextmenu', (event) =>
          event.preventDefault()
        );
    },
    dashboard() {
      this.$router.replace({ name: 'dashboard' });
    },
    async firstLoad() {
      this.$tauri.infoLogger(
        'INDEX | First Time RUN, resetting reward address'
      );
      // reset node name in case there is a leftover from prev launch (restart due to error)
      this.store.setNodeName(this.$config, '');
      const { launchOnBoot } = await this.$tauri.readConfig();
      if (launchOnBoot) {
        Notify.create({
          message: this.$t('index.autoLaunchNote'),
          icon: 'info'
        });
      }
    },
    async viewDisclaimer(destination: string) {
      const modal = await util.showModal(disclaimer);
      modal?.onDismiss(() => {
        this.$router.replace({ name: destination });
      });
    }
  }
});
</script>
