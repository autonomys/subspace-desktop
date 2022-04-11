<template lang="pug">
q-page(padding)
  .row.justify-center.q-mt-xl
    .text-h4 {{ lang.pageTitle }}
  .row.justify-center.q-mt-lg
    p {{ lang.subtitle }}
  .row.justify-center.q-mt-xl
    q-btn(
      :label="lang.quickStart"
      @click="$router.push({ name: 'setupPlot' })"
      outline
      size="xl"
    )
  .row.justify-center.q-mt-sm
    q-btn(
      :label="lang.advanced"
      @click="$router.push({ name: 'importKey' })"
      color="grey"
      flat
    )
</template>

<script lang="ts">
import { defineComponent } from "vue"
import { globalState as global } from "src/lib/global"
import * as util from "src/lib/util"
import { appConfig } from "src/lib/appConfig"
import { Notify } from "quasar"
const lang = global.data.loc.text.index

export default defineComponent({
  data() {
    return { lang, client: global.client }
  },
  mounted() {
    try {
      this.checkDev()
      const config = appConfig.getAppConfig()
      if (config) {
        const { plot, account } = config
        if (
          plot &&
          account &&
          plot.location.length > 0
        ) {
          console.log("INDEX - NOT First Time RUN.")
          this.dashboard()
          return
        }
      }
      this.firstLoad()
    } catch (e) {
      this.firstLoad()
    }
  },
  methods: {
    checkDev() {
      if (util.CONTEXT_MENU === "OFF")
        document.addEventListener("contextmenu", (event) =>
          event.preventDefault()
        )
    },
    dashboard() {
      this.$router.replace({ name: "dashboard" })
    },
    firstLoad() {
      console.log("INDEX - First Time RUN.")
      this.loadNetworkData()
      const config = appConfig.getAppConfig()
      if (config && config.launchOnBoot == true) {
        Notify.create({
          message: "Subspace Desktop will be started on boot. You can disable this from settings (the gear icon on top-right).",
          icon: "info"
        })
      }
    },
    async loadNetworkData() {
      await this.client.connectPublicApi()
      const networkSegmentCount = await this.client.getNetworkSegmentCount()
      await this.client.disconnectPublicApi()
      const totalSize = networkSegmentCount * 256 * util.PIECE_SIZE
      const allocatedGB = Math.round((totalSize * 100) / util.GB) / 100
      appConfig.updateAppConfig(null, null, {
        networkSegmentCount,
        allocatedGB: allocatedGB === 0 ? 0.1 : allocatedGB
      }, null, null)
    }
  }
})
</script>
