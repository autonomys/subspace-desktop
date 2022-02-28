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
  .row.justify-center.q-mt-sm
    q-btn(
      :label="lang.advanced"
      @click="$router.push({ name: 'advanced' })"
      color="grey"
      flat
    )
</template>

<script lang="ts">
import { defineComponent } from "vue"
import { globalState as global } from "src/lib/global"
import * as util from "src/lib/util"
import { startFarming, startNode } from "src/lib/client"
const lang = global.data.loc.text.index

export default defineComponent({
  data() {
    return { lang }
  },
  async mounted() {
    try {
      if (util.DEV_MODE !== "DEV")
        document.addEventListener('contextmenu', event => event.preventDefault())

      const config = await util.config.read()
      const validConfig = util.config.validate(config)

      console.log("INDEX CONFIG", config)

      if (validConfig && config.plot && config.account) {
        console.log(`NOT First RUN: plot ${config.plot} :: account ${config.account} :: validConfig ${validConfig}`)

        await startNode(config.plot.nodeLocation)
        console.log("WAIT FOR NODE - 15 secs")
        await new Promise((resolve) => setTimeout(resolve, 15000))
        console.log("WAIT FOR NODE - ok")

        await startFarming(config.plot.location)
        this.$router.replace({ name: "dashboard" })
      }
    } catch (e) {
      console.log("No existing plot and account. First Time RUN.", e)
    }
  },
})
</script>
