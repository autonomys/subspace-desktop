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
            p {{ block.rewardAddr.substring(0, 8) + '...' + block.rewardAddr.substring(block.rewardAddr.length - 8, block.rewardAddr.length) }}
          .col-3
            a(:href="block.appsLink" target="_blank") # {{ block.blockNum.toLocaleString() }}
          .col-3
            p.text-weight-light {{ formatDate(block.time) }}
          .col-2
            p {{ block.blockReward }} testSSC
</template>

<script lang="ts">
import { defineComponent } from "vue"
import * as util from "src/lib/util"
import { globalState as global } from "src/lib/global"
import { FarmedBlock } from "src/lib/types"
import { formatDistanceToNowStrict } from "date-fns"
import { appConfig } from "src/lib/appConfig"

const lang = global.data.loc.text.dashboard

export default defineComponent({
  props: {
    expanded: { type: Boolean, default: false },
    farmedTotalEarned: { type: Number, default: 0 }
  },
  emits: ["expand"],
  data() {
    return { lang, util, global: global.data, client: global.client, rewardAddress: "", }
  },
  mounted() {
    this.rewardAddress = this.displayRewardAddress()
  },
  computed: {
    farmedBlocksList(): FarmedBlock[] {
      return this.client?.data?.farming.farmed || []
    },
    blocksListStyle(): { [index: string]: string } {
      return this.expanded ? { height: "370px" } : { height: "185px" }
    }
  },
  methods: {
    formatDate(date: Date) {
      return formatDistanceToNowStrict(date)
    },
    displayRewardAddress() {
      const addr: string | undefined = appConfig.getAppConfig()?.rewardAddress
      if (!addr) {
        console.error("Reward Address was null/undefined!")
        return "???"
      } else {
        return addr
      }
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
