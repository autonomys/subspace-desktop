<template lang="pug">
q-page(padding)
  .row.justify-center.q-mt-xl
    .text-h4 {{ lang.pageTitle }}
  .row.justify-center.q-mt-md
    .text-p {{ lang.rewardAddress }}
  .row.justify-center.q-mt-sm
    div {{ lang.securePassword }}
    q-input(
      outlined
      dense
      class="reward-address"
      v-model="rewardAddress"
      input-class="text-center"
      :rules="[val => isValidSubstrateAddress(val) || 'Invalid address']"
    )
  .row.justify-center.q-mt-sm
  .row.justify-end.items-center.q-mt-lg.absolute-bottom.q-pa-lg
    .col-auto.q-mr-md
      q-btn(@click="$router.replace({ name: 'index' })" label="Cancel" outline size="lg" icon-right="cancel")
    q-space
    .col-auto
      q-btn(
        :disable="!isValidSubstrateAddress(rewardAddress)"
        :label="lang.continue"
        @click="importKey()"
        icon-right="arrow_forward"
        outline
        size="lg"
      )
      q-tooltip.q-pa-md(v-if="!isValidSubstrateAddress(rewardAddress)")
        p.q-mb-lg {{ lang.tooltip }}
</template>

<script lang="ts">
import { defineComponent } from "vue"
import { globalState as global } from "src/lib/global"
import { appConfig } from "src/lib/appConfig"
import { decodeAddress, encodeAddress } from "@polkadot/keyring"
import { hexToU8a, isHex } from "@polkadot/util"
const lang = global.data.loc.text.importKey

export default defineComponent({
  data() {
    return {
      rewardAddress: "",
      global: global.data,
      lang
    }
  },
  methods: {
    isValidSubstrateAddress(val: string): boolean {
      try {
        encodeAddress(isHex(val) ? hexToU8a(val) : decodeAddress(val))
        return true
      } catch (error) {
        return false
      }
    },
    async importKey() {
      appConfig.updateAppConfig(null, null, null, this.rewardAddress, null)
      this.$router.replace({ name: "setupPlot" })
    },
    skip() {
      this.$router.replace({ name: "setupPlot" })
    }
  }
})
</script>


<style lang="sass">
.reward-address
  width: 500px
  font-size: 17px
  padding-top: 5px
  margin-top: 0px
</style>
