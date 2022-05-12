<template lang="pug">
q-layout(view="hHh lpr fFf")
  q-header.bg-white.text-black(bordered)
    q-toolbar
      q-img(no-spinner src="subspacelogo.png" width="150px")
      q-toolbar-title
        .row
          .col-auto.q-mr-lg.relative-position
            p {{ "0.4.9 "}}
          .col-auto.q-mr-md.relative-position
            q-badge(color="grey" text-color="white")
              .q-pa-xs(style="font-size: 14px") {{ lang.nonIncentivizedLabel }}
            q-tooltip
              .col
                p.no-margin(style="font-size: 12px") {{ lang.nonIncentivizedTooltip }}
          .col-auto.q-mr-md.relative-position(
            v-if="nodeName != ''"
          )
            q-badge(color="blue-8" text-color="white")
              .q-ma-xs(style="font-size: 14px") {{ "Node Name:" }}
              .q-mr-xs(class="text-italic" style="font-size: 14px") {{ nodeName }}
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
import { globalState as global } from "src/lib/global"
import * as util from "src/lib/util"
import MainMenu from "components/mainMenu.vue"
import { myEmitter } from "src/lib/client"

const lang = global.data.loc.text.mainMenu

export default defineComponent({
  name: "MainLayout",

  components: { MainMenu },

  data() {
    return {
      lang,
      global: global.data,
      util,
      autoLaunch: false,
      nodeName: ''
    }
  },
  mounted() {
    this.nodeNameChanger()
    util.infoLogger("Version: 0.4.9")
  },
  methods: {
    async nodeNameChanger() {
      myEmitter.on("nodeName", (arg1: string) => {
        this.nodeName = arg1
      });
    },
  }
})
</script>
