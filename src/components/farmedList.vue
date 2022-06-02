<template lang="pug">
q-card(bordered flat)
  .q-pa-sm
    .row.items-center
      .col-auto.q-mr-sm
        .row.items-center
          .text-h6.text-weight-light {{ lang.farmedBlocks }}:
      .col-auto.q-mr-xl
        h6 {{ farmedBlocksList?.length }}
      .col-auto.q-mr-xl
        .text-weight-light Total Earned
        p {{ farmedTotalEarned }} testSSC
      .col-auto
        .text-weight-light Reward Address
        .reward-address {{ rewardAddress }}
      q-space
      .col.col-auto
        .row.justify-center
          q-btn(
            @click="$emit('expand', true)"
            color="grey-10"
            flat
            icon-right="list"
            size="md"
            stretch
            v-if="!expanded"
          )
          q-btn(
            @click="$emit('expand', false)"
            color="grey-10"
            flat
            icon-right="south"
            size="md"
            stretch
            v-else
          )

  q-separator
  .row.q-pa-sm.q-ml-lg.q-ma-sm
    .col-4 {{ lang.farmedBy }}
    .col-3 {{ lang.blockNum }}
    .col-3 {{ lang.time }}
    .col-2 {{ lang.rewards }}
  q-scroll-area(:style="blocksListStyle")
    transition-group(
      appear
      enter-active-class="animated slideInTop "
      name="list"
    )
      .bg-white(:key="block.time" v-for="block of farmedBlocksList")
        q-separator
        .row.q-pa-xs.q-ml-sm.q-ma-xs
          .col-4
            p {{ formatAddress(block.rewardAddr) }}
          .col-3
            a(:href="blockLink(block.blockNum.toString())" target="_blank") # {{ block.blockNum.toLocaleString() }}
          .col-3
            p.text-weight-light {{ formatDate(block.time) }}
          .col-2
            p {{ block.blockReward }} testSSC
</template>

<script lang="ts">
import { defineComponent } from "vue"
import { formatDistanceToNowStrict } from "date-fns"
import * as process from "process"
import * as util from "../lib/util"
import { globalState as global } from "../lib/global"
import { FarmedBlock } from "../lib/types"
import { appConfig } from "../lib/appConfig"

const lang = global.data.loc.text.dashboard

const NETWORK_RPC = process.env.PUBLIC_API_WS || "ws://localhost:9947";
const appsLink = "https://polkadot.js.org/apps/?rpc=" + NETWORK_RPC + "#/explorer/query/"

export default defineComponent({
  props: {
    expanded: { type: Boolean, default: false },
    farmedTotalEarned: { type: Number, default: 0 }
  },
  emits: ["expand"],
  data() {
    return { 
      lang, 
      util, 
      global: global.data, 
      rewardAddress: "", 
      appsLink,
    }
  },
  computed: {
    farmedBlocksList(): FarmedBlock[] {
      const result = this.$client.data?.farming.farmed.filter((block) => {
        return block.rewardAddr == this.rewardAddress
      })
      return result
    },
    blocksListStyle(): { [index: string]: string } {
      return this.expanded ? { height: "370px" } : { height: "185px" }
    },
  },
  async mounted() {
    this.rewardAddress = (await appConfig.read()).rewardAddress;
  },
  methods: {
    blockLink(blockNumber: string) {
      return appsLink + blockNumber;
    },
    formatDate(date: Date) {
      return formatDistanceToNowStrict(date)
    },
    formatAddress(address: string){
      return address.substring(0, 8) + '...' + address.substring(address.length - 8, address.length)
    }
  }
})
</script>

<style lang="sass">
.reward-address
  padding-top: 5px
  padding-bottom: 6px
  font-size: 10px
</style>
