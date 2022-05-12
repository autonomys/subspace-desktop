<template lang="pug">
q-page(padding)
  .q-ma-xl
    .row.no-wrap.items-center.q-ma-xl.q-pt-lg
      .text-h1.q-pr-lg 👩‍🌾
      .column
        .text-h5.q-pb-md {{ lang.pageTitle }}
        p {{ lang.subtitle }}
  .row.justify-center.q-mt-xl
    q-btn(
      :label="lang.quickStart"
      @click="viewDisclaimer('setupPlot')"
      outline
      size="md"
      no-caps
    )
  .row.justify-center.q-pt-md.q-pb-sm
    p — or —
  .row.justify-center
    q-btn(
      :label="lang.advanced"
      @click="viewDisclaimer('importKey')"
      color="grey"
      flat
      no-caps
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
  async mounted() {
    try {
      this.checkDev()
      const config = await appConfig.read()
      if (appConfig.validate(config)) {
        util.infoLogger("INDEX | NOT First Time RUN.")
        this.dashboard()
        return
      }
      util.infoLogger("validate failed, we should start from scratch")
      this.firstLoad()
    } catch (e) {
      util.infoLogger("config could not be read, starting from scratch")
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
    async firstLoad() {
      util.infoLogger("INDEX | First Time RUN, resetting reward address")
      await appConfig.update({ rewardAddress: "" })
      this.loadNetworkData()
      const config = await appConfig.read()
      if (config.launchOnBoot) {
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
        await appConfig.update({ segmentCache: {
          networkSegmentCount,
          blockchainSizeGB: blockchainSizeGB === 0 ? 0.1 : blockchainSizeGB
        }})
      })
      raceResult.catch(_ => {
        util.errorLogger("The server seems to be too congested! Please try again later...")
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
