<template lang="pug">
q-menu(auto-close)
  q-list(style="min-width: 150px")
    q-item
      .row.items-center
        .col-auto.q-mr-md
          q-toggle(@click="toggleClicked()" v-model="launchOnStart")
        .col
          p.text-grey(v-if="!launchOnStart") {{ $t('menu.autoStart') }}
          p.text-black(v-else) {{ $t('menu.autoStart') }}
    q-item(@click="installNewUpdate()" clickable v-if="store.hasNewUpdate")
      .row.items-center
        .col-auto.q-mr-md
          q-icon(color="green" name="upload")
        .col
          p {{ $t('menu.updateAvailable') }}
    q-item(@click="exportLogs()" clickable)
      .row.items-center
        .col-auto.q-mr-md
          q-icon(name="print")
        .col
          p {{ $t('menu.export_log') }}
    q-item(@click="reset()" clickable)
      .row.items-center
        .col-auto.q-mr-md
          q-icon(color="red" name="refresh")
        .col
          p.text-red {{ $t('menu.reset') }}
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { Dialog, Notify } from 'quasar';
import { process, event, tauri } from '@tauri-apps/api';
import { LocalStorage as localStorage } from 'quasar';

import * as util from '../lib/util';
import { useStore } from '../stores/store';

export default defineComponent({
  setup() {
    const store = useStore();
    return { store };
  },
  data() {
    return {
      util,
      launchOnStart: false
    };
  },
  mounted() {
    this.initMenu();
  },
  methods: {
    async toggleClicked() {
      console.log('toggle Clicked', this.launchOnStart);
      if (this.launchOnStart) {
        Notify.create({
          message: this.$t('menu.willAutoLaunch'),
          icon: 'info',
          group: 1,
          badgeStyle: 'visibility:hidden;'
        });
      } else {
        Notify.create({
          message: this.$t('menu.willNotAutoLaunch'),
          icon: 'info',
          group: 1,
          badgeStyle: 'visibility:hidden;'
        });
      }
      if (this.launchOnStart) {
        try {
          await this.$autoLauncher.enable();
        } catch (error) {
          this.$tauri.errorLogger(error);
          this.store.setError({ title: 'errorPage.enableAutoLauncherFailed' });
        }
      } else {
        try {
          await this.$autoLauncher.disable();
        } catch (error) {
          this.$tauri.errorLogger(error);
          this.store.setError({ title: 'errorPage.disableAutoLauncherFailed' });
        }
      }
    },
    reset() {
      Dialog.create({
        message: `
        <h6>
          ${this.$t('menu.reset_heading')}
        </h6>
        <div style="height:10px;">
        </div>
        <p>
         ${this.$t('menu.reset_explanation')}
        </p>
        `,
        html: true,
        ok: { label: 'reset', icon: 'refresh', flat: true, color: 'red' },
        cancel: true
      }).onOk(async () => {
        try {
          await util.resetAndClear({
            localStorage,
            tauri: this.$tauri,
            config: this.$config
          });
          await new Promise((resolve) => setTimeout(resolve, 1000));
          await process.relaunch();
        } catch (error) {
          this.$tauri.errorLogger(error);
          this.store.setError({ title: 'errorPage.resetFailed' });
        }
      });
    },
    async exportLogs() {
      try {
        await this.$tauri.openLogDir();
      } catch (error) {
        this.$tauri.errorLogger(error);
        this.store.setError({ title: 'errorPage.getLogsFailed' });
      }
    },
    async initMenu() {
      this.launchOnStart = await this.$autoLauncher.isEnabled();
    },
    async installNewUpdate() {
      await event.emit('tauri://update');
    }
  }
});
</script>

<style lang="scss">
</style>
