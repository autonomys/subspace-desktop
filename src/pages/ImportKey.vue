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
  .row.justify-center.q-mt-xl
    .text-h4 {{ lang.or }}
  .row.justify-center.q-mt-xl
    div {{ lang.extraTip }}
  .row.justify-center.q-mt-sm
    div {{ lang.extraTip2 }}
  .row.justify-center.q-mt-md
    .col-auto
      .row
        q-btn(
        :label="lang.connectWallet"
        outline
        size="lg"
      )
  .row.justify-center.q-mt-sm
  .row.justify-end.items-center.q-mt-lg.absolute-bottom.q-pa-lg
    .col-auto.q-mr-md
      q-btn(@click="skip()" color="grey" label="Skip" flat icon-right="east")
    .col-auto
      q-btn(
        :disable="!validKey"
        :label="lang.continue"
        @click="importKey()"
        icon-right="arrow_forward"
        outline
        size="lg"
      )
      q-tooltip.q-pa-md(v-if="!validKey")
        p.q-mb-lg {{ lang.tooltip }}
</template>

<script lang="ts">
import { defineComponent } from "vue"
import { LocalStorage } from "quasar"
import { globalState as global } from "src/lib/global"
import { invoke } from '@tauri-apps/api/tauri'
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
    async validKey(): Promise<boolean> {
      return invoke("check_reward_address_validity", { s: this.rewardAddress })
    },
    async importKey() {
      if (await this.validKey()) {
        console.log("REWARD ADDRESS IS CORRECT")
        LocalStorage.set("rewardAddress", this.rewardAddress)
        this.$router.replace({ name: "setupPlot" })
      } else {
        console.log("REWARD ADDRESS IS INVALID")
      }

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
