<template lang="pug">
q-page(padding)
  .row.justify-center.q-mt-xl
    .text-h4 {{ lang.pageTitle }}
  .row.justify-center.q-mt-lg
    p {{ lang.subtitle }}
  .row.justify-center.q-mt-xl
    q-btn(
      :label="lang.quickStart"
      @click="$router.push({ name: 'setPassword' })"
      outline
      size="xl"
    )
</template>

<script lang="ts">
import { defineComponent } from "vue"
import { globalState as global } from "src/lib/global"
import * as util from "src/lib/util"
import { appConfig } from "src/lib/appConfig"
import { LocalStorage } from "quasar"
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
          plot.location.length > 0 &&
          account.passHash.length > 0
        ) {
          console.log("INDEX - NOT First Time RUN.")
          this.dashboard()
          return
        }
      }
      this.clear()
    } catch (e) {
      this.clear()
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
    clear() {
      console.log("INDEX - First Time RUN.")
      LocalStorage.clear()
      appConfig.initAppConfig()
      this.loadNetworkData()
    },
    async loadNetworkData() {
      await this.client.connectPublicApi()
      const lastNetSegmentIndex = await this.client.getNetworkSegmentIndex()
      const totalSize = lastNetSegmentIndex * 256 * util.PIECE_SIZE
      const allocatedGB = Math.round((totalSize * 100) / util.GB) / 100
      appConfig.updateAppConfig(null, null, {
        lastNetSegmentIndex,
        allocatedGB: allocatedGB === 0 ? 0.1 : allocatedGB
      })
    }
  }
})
</script>
