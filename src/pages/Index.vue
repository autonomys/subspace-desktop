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
import { config } from "src/lib/util"
import { startFarming } from "src/lib/client"
const lang = global.data.loc.text.index

export default defineComponent({
  data() {
    return { lang }
  },
  async mounted() {
    try {
      // Disable reload, forward and back options from context menu. 
      document.addEventListener('contextmenu', event => event.preventDefault());
      const { account, plot } = await config.read()
      console.log("INDEX CONFIG", { account, plot })
      if (account?.farmerPublicKey && plot?.location) {
        console.log(`NOT First Time RUN: Found Existing :: plot ${plot.location} :: farmerPublicKey ${account.farmerPublicKey}`)
        await startFarming(plot.location)
        this.$router.replace({ name: "dashboard" })
      }
    } catch (e) {
      console.log("No existing plot and account. First Time RUN.", e)
    }
  },
})
</script>
