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
    const configData = await config.read()
    // If the app star and config with plot and account exists, start the farmer 
    // Using current plot and redirect to dashboard screen .
    if(configData?.account && configData?.plot?.location){
      await startFarming(configData?.plot?.location.replace("/subspace.plot", ""))
      this.$router.replace({ name: "dashboard" })
    }
  },
  methods: {}
})
</script>
