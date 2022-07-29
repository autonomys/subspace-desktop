<template lang="pug">
q-layout(view="hHh lpr fFf")
  q-header.bg-white.text-black(bordered)
    q-toolbar.app-toolbar
      q-img(no-spinner src="subspacelogo.png" width="150px")
      q-toolbar-title
        .row.items-center
          .col-auto.q-mr-lg.relative-position
            p {{ appVersion }}
          .col-auto.q-mr-md.relative-position
            q-badge(color="grey" text-color="white")
              .q-pa-xs(style="font-size: 14px") {{ $t('header.IncentivizedLabel') }}
            q-tooltip
              .col
                p.no-margin(style="font-size: 12px") {{ $t('header.IncentivizedTooltip') }}
          .col-auto.q-mr-md.relative-position(v-if="store.nodeName || oldNodeName")
            q-badge.cursor-pointer(
              v-if="!isEdittingName"
              @click="onNameClick"
              color="blue-8"
              text-color="white"
            )
              .q-ma-xs(style="font-size: 14px") {{ $t('header.nodeName') }}
              .q-mr-xs(
                class="text-italic"
                style="font-size: 14px"
              ) {{ store.trimmedName }}
            q-input.name-input(
              ref="nameInput"
              v-else
              v-model="store.nodeName"
              @blur="saveName"
              @keyup.enter="saveName"
              dense="dense"
              outlined
              autofocus
            )
          // Show the dashboard status indicator when on the dashboard page.
          .col-auto.q-mr-md.relative-position(
            v-if="$route.name == 'dashboard'"
          )
      div
        q-btn(flat icon="settings" round)
          MainMenu

  q-page-container
    router-view
</template>

<script lang="ts">
import { defineComponent, watch } from "vue"
import * as process from 'process'
import { relaunch } from "@tauri-apps/api/process"

import * as util from '../lib/util';
import { config } from "../lib/appConfig"
import MainMenu from "../components/mainMenu.vue"
import errorModal from "../components/errorModal.vue";
import { useStore } from '../stores/store';

export default defineComponent({
  name: "MainLayout",
  components: { MainMenu },
  setup() {
    const store = useStore();
    return { store };
  },
  data() {
    return {
      appVersion: "",
      util,
      isEdittingName: false,
      oldNodeName: "",
    }
  },
  mounted() {
    this.appVersion = (process.env.APP_VERSION as string)
    util.infoLogger("Version: " + this.appVersion)

    watch(
      () => this.store.error.title,
      async () => {
        const { title, message } = this.store.error;
        await util.showModal(errorModal, { title, message });
      },
    )
  },
  methods: {
    onNameClick() {
      this.setEditName(true);
      this.oldNodeName = this.store.nodeName;
    },
    async saveName() {
      this.setEditName(false);
      // if user left input empty - use prev name
      if (!this.store.nodeName) {
        this.store.setNodeName(config, this.oldNodeName)
      // only restart if name has changed
      } else if (this.oldNodeName !== this.store.nodeName) {
        this.store.setNodeName(config, this.store.nodeName);
        await relaunch();
      }
    },
    setEditName(value: boolean) {
      this.isEdittingName = value;
    }
  }
})
</script>
