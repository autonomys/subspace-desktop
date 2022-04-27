<template lang="pug">
q-page(padding)
  .row.justify-center.q-mt-xl
    .text-h4 {{ lang.pageTitle }}
  .row.justify-center.q-mt-lg
    p {{ lang.subtitle }}
  .row.justify-center.q-mt-xl
    q-btn(
      :label="lang.quickStart"
      @click="viewDisclaimer('setupPlot')"
      outline
      size="xl"
    )
  .row.justify-center.q-mt-sm
    q-btn(
      :label="lang.advanced"
      @click="viewDisclaimer('importKey')"
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
import disclaimer from "components/disclaimer.vue"

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
        const { plottingStarted } = config
        if (
          plottingStarted
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
      if (config && config.launchOnBoot) {
        Notify.create({
          message: "Subspace Desktop will be started on boot. You can disable this from settings (the gear icon on top-right).",
          icon: "info"
        })
      }
    },
    async loadNetworkData() {
      const raceResult = util.promiseTimeout(7000, this.client.connectPublicApi())
      raceResult.then(async() => {
        const networkSegmentCount = await this.client.getNetworkSegmentCount()
        await this.client.disconnectPublicApi()
        const totalSize = networkSegmentCount * 256 * util.PIECE_SIZE
        const blockchainSizeGB = Math.round((totalSize * 100) / util.GB) / 100
        appConfig.updateAppConfig(null, {
          networkSegmentCount,
          blockchainSizeGB: blockchainSizeGB === 0 ? 0.1 : blockchainSizeGB
        }, null, null, null)
      })
      raceResult.catch(_ => {
        console.error("The server seems to be too congested! Please try again later...")
      })
    },
    async viewDisclaimer(destination: string) {
      const modal = await util.showModal(disclaimer)
      modal?.onDismiss(() => {
        this.$router.replace({ name: destination })
      })
    }
  }
})
</script>
