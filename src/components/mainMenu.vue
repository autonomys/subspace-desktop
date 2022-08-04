<template lang="pug">
q-menu(auto-close)
  q-list(style="min-width: 150px")
    q-item
      .row.items-center
        .col-auto.q-mr-md
          q-toggle(
            :disable="disableAutoLaunch"
            @click="toggleClicked()"
            v-model="launchOnStart"
          )
        .col
          p.text-grey(v-if="!launchOnStart") {{ $t('menu.autoStart') }}
          p.text-black(v-else) {{ $t('menu.autoStart') }}
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
import { relaunch } from '@tauri-apps/api/process';
import { open as shellOpen } from '@tauri-apps/api/shell';
import { LocalStorage as localStorage } from 'quasar';

import * as plotDir from '../lib/plotDir';
import * as util from '../lib/util';

export default defineComponent({
  data() {
    return {
      util,
      launchOnStart: false,
      disableAutoLaunch: false
    };
  },
  mounted() {
    this.initMenu();
  },
  methods: {
    async toggleClicked() {
      if (this.disableAutoLaunch) {
        Notify.create({
          message: this.$t('menu.autoLaunchNotSupported'),
          icon: 'info'
        });
        return;
      }
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
        await this.$autoLauncher.enable();
      } else {
        await this.$autoLauncher.disable();
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
        await util.resetAndClear({ plotDir, localStorage, config: this.$config });
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await relaunch();
      });
    },
    async exportLogs() {
      try {
        const log_path = await util.getLogPath();
        util.infoLogger('log path acquired:' + log_path);
        await shellOpen(log_path);
      } catch (error) {
        // TODO: add proper error handling - update store and show error page
        util.errorLogger(error);
      }
    },
    async initMenu() {
      if (this.$autoLauncher.enabled !== undefined) {
        this.launchOnStart = await this.$autoLauncher.enabled;
      } else {
        this.launchOnStart = false;
        this.disableAutoLaunch = true;
      }
    }
  }
});
</script>

<style lang="scss">
</style>
