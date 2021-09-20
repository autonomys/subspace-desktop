<template lang="pug">
q-menu(auto-close)
  q-list(style="min-width: 150px")
    q-item
      .row.items-center
        .col-auto.q-mr-md
          q-toggle(:disable="disableAutoLaunch" @click="toggleClicked()" v-model="autoLaunch")
        .col
          p.text-grey(v-if="!autoLaunch") {{ lang.autoStart }}
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
import * as util from "src/lib/util"
import { globalState as global } from "src/lib/global"
const lang = global.data.loc.text.mainMenu

export default defineComponent({
  data() {
    return { lang, autoLaunch: false, launchOnBoot: global.data.launchOnBoot, disableAutoLaunch: false }
  },
  mounted() {
    this.initMenu()
  },
  methods: {
    async toggleClicked() {
      if (this.disableAutoLaunch) {
        Notify.create({ message: "Launch on Boot is not supported on this system.", icon: "info" })
        return
      }
      console.log("toggle Clicked", this.autoLaunch)
      if (this.autoLaunch) Notify.create({ message: lang.willAutoLaunch, icon: "info", group: 1, badgeStyle: "visibility:hidden;" })
      else Notify.create({ message: lang.willNotAutoLaunch, icon: "info", group: 1, badgeStyle: "visibility:hidden;" })
      if (this.autoLaunch) {
        await this.launchOnBoot.disable()
        await this.launchOnBoot.enable()
      } else {
        await this.launchOnBoot.disable()
      }
    },
    reset() {
      Dialog.create({
        message: `
        <h6>
          Are you sure you want to reset?
        </h6>
        <div style="height:10px;">
        </div>
        <p>
          You will need to re-import your existing private key in order to recover any existing plot or funds.
        </p>
        `,
        html: true,
        ok: { label: "reset", icon: "refresh", flat: true, color: "red" },
        cancel: true,
      }).onOk(async () => {
        util.reset()
        this.$router.replace({ name: "index" })
      })
    },
    async initMenu() {
      console.log("Init Menu", typeof this.launchOnBoot.enabled)
      // this.disableAutoLaunch = true
      if (this.launchOnBoot.enabled != undefined) this.autoLaunch = this.launchOnBoot.enabled
      else {
        this.autoLaunch = false
        this.disableAutoLaunch = true
      }
    },
  },
})
</script>

<style lang="scss">
</style>
