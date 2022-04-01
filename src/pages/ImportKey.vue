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
    )
  .row.justify-center.q-mt-sm
  .row.justify-end.items-center.q-mt-lg.absolute-bottom.q-pa-lg
    .col-auto.q-mr-md
      q-btn(@click="skip()" color="grey" label="Skip" flat icon-right="east")
    .col-auto
      q-btn(
        :disable="!isValidSubstrateAddress"
        :label="lang.continue"
        @click="importKey()"
        icon-right="arrow_forward"
        outline
        size="lg"
      )
      q-tooltip.q-pa-md(v-if="!isValidSubstrateAddress")
        p.q-mb-lg {{ lang.tooltip }}
</template>

<script lang="ts">
import { defineComponent } from "vue"
import { LocalStorage } from "quasar"
import { globalState as global } from "src/lib/global"
// Import Polkadot.js API dependencies.
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
  computed: {
    isValidSubstrateAddress(): boolean {
      try {
        encodeAddress(isHex(this.rewardAddress) ? hexToU8a(this.rewardAddress) : decodeAddress(this.rewardAddress))
        return true
      } catch (error) {
        return false
      }
    },
  },
  methods: {

    async importKey() {
      LocalStorage.set("rewardAddress", this.rewardAddress)
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
