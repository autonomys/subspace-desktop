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
          p.text-grey(v-if="!launchOnStart") {{ lang.autoStart }}
          p.text-black(v-else) {{ lang.autoStart }}
    q-item(@click="reset()" clickable)
      .row.items-center
        .col-auto.q-mr-md
          q-icon(color="red" name="refresh")
        .col
          p.text-red {{ lang.reset }}
</template>

<script lang="ts">
import { defineComponent } from "vue"
import { Dialog, Notify } from "quasar"
import { relaunch } from "@tauri-apps/api/process"
import * as util from "../lib/util"
import { globalState as global } from "../lib/global"

const lang = global.data.loc.text.mainMenu

export default defineComponent({
  data() {
    return {
      lang,
      util,
      launchOnStart: false,
      disableAutoLaunch: false
    }
  },
  mounted() {
    this.initMenu()
  },
  methods: {
    async toggleClicked() {
      if (this.disableAutoLaunch) {
        Notify.create({
          message: "Launch on Boot is not supported on this system.",
          icon: "info"
        })
        return
      }
      console.log("toggle Clicked", this.launchOnStart)
      if (this.launchOnStart) {
        Notify.create({
          message: lang.willAutoLaunch,
          icon: "info",
          group: 1,
          badgeStyle: "visibility:hidden;"
        })
      } else {
        Notify.create({
          message: lang.willNotAutoLaunch,
          icon: "info",
          group: 1,
          badgeStyle: "visibility:hidden;"
        })
      }
      if (this.launchOnStart) {
        await this.$autoLauncher.enable()
      } else {
        await this.$autoLauncher.disable()
      }
    },
    reset() {
      Dialog.create({
        message: `
        <h6>
          ${lang.reset_heading}
        </h6>
        <div style="height:10px;">
        </div>
        <p>
         ${lang.reset_explanation}
        </p>
        `,
        html: true,
        ok: { label: "reset", icon: "refresh", flat: true, color: "red" },
        cancel: true
      }).onOk(async () => {
        await util.resetAndClear()
        await new Promise((resolve) => setTimeout(resolve, 1000))
        await relaunch()
      })
    },
    async initMenu() {
      if (this.$autoLauncher.enabled !== undefined) {
        this.launchOnStart = await this.$autoLauncher.enabled
      } else {
        this.launchOnStart = false
        this.disableAutoLaunch = true
      }
    }
  }
})
</script>

<style lang="scss">
</style>
