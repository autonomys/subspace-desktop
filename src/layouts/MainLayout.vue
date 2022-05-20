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
              .q-pa-xs(style="font-size: 14px") {{ lang.nonIncentivizedLabel }}
            q-tooltip
              .col
                p.no-margin(style="font-size: 12px") {{ lang.nonIncentivizedTooltip }}
          .col-auto.q-mr-md.relative-position
            q-badge.cursor-pointer(
              v-if="!isEditName" 
              color="blue-8" 
              text-color="white"
              @click="onNameClick"
            )
              .q-ma-xs(style="font-size: 14px") {{ "Node Name:" }}
              .q-mr-xs(
                class="text-italic" 
                style="font-size: 14px"
              ) {{ readableName }}
            q-input.name-input(
              ref="nameInput"
              v-else 
              v-model="global.nodeName" 
              @blur="confirmName"
              @keyup.enter="confirmName"
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
import { defineComponent } from "vue"
import * as process from 'process'
import * as util from "../lib/util"
import MainMenu from "../components/mainMenu.vue"
import { globalState as global } from "../lib/global"

const lang = global.data.loc.text.mainMenu

export default defineComponent({
  name: "MainLayout",
  components: { MainMenu },
  data() {
    return {
      lang,
      global: global.data,
      appVersion: "",
      util,
      autoLaunch: false,
      isEditName: false,
      oldNodeName: "",
    }
  },
  computed: {
    readableName() {
      const { nodeName } = global.data;
      return nodeName.length > 20 
        ? `${nodeName.slice(0, 20)}...` 
        : nodeName;
    }
  },
  mounted() {
    this.appVersion = (process.env.APP_VERSION as string)
    util.infoLogger("Version: " + this.appVersion)

  },
  methods: {
    onNameClick() {
      this.setEditName(true);
      this.oldNodeName = global.data.nodeName;
    },
    confirmName() {
      // if user left input empty - use prev name
      const newName = !global.data.nodeName 
        ? this.oldNodeName 
        : global.data.nodeName;

      global.setNodeName(newName)
      this.setEditName(false);
    },
    setEditName(value: boolean) {
      this.isEditName = value;
    }
  }
})
</script>
