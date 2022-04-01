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
const lang = global.data.loc.text.index

export default defineComponent({
  data() {
    return { lang, client: global.client }
  },
  async mounted() {
    try {
      this.checkDev()
      const appDir = await util.getAppDir()
      const config = await util.config.read(appDir)
      const validConfig = util.config.validate(config)
      const { plot, account } = config

      if (validConfig && plot && account) {
        console.log("INDEX - NOT First Time RUN.")
        this.dashboard()
      } else {
        await this.clear()
      }
    } catch (e) {
      await this.clear()
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
    async clear() {
      console.log("INDEX - First Time RUN.")
      await util.config.clear()
      await util.config.writeEmpty()
      this.loadNetworkData()
    },
    async loadNetworkData() {
      await this.client.connectPublicApi()
      const lastNetSegmentIndex = await this.client.getNetworkSegmentIndex()
      const totalSize = lastNetSegmentIndex * 256 * util.PIECE_SIZE
      const allocatedGB = Math.round((totalSize * 100) / util.GB) / 100

      const config = await util.config.read()
      await util.config.update({
        ...config,
        utilCache: {
          lastNetSegmentIndex,
          allocatedGB: allocatedGB === 0 ? 0.1 : allocatedGB
        }
      })
    }
  }
})
</script>
