<template lang="pug">
q-card(bordered flat)
  .q-pa-sm
    .row.items-center
      .col-auto.q-mr-sm
        .row.items-center
          q-icon.q-mr-sm(color="grey" name="grid_view" size="40px")
          .text-h6.text-weight-light {{ lang.farmedBlocks }}:
      .col-auto.q-mr-md
        h6 {{ farmedBlocksList?.length }}
      .col-auto.q-mr-md
        .text-weight-light Total Earned
        p {{ farmedTotalEarned }} tSSC
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
  .row.q-gutter-sm.q-pa-md
    .col-3 {{ lang.farmedBy }}
    .col-1 {{ lang.blockNum }}
    .col-4 {{ lang.time }}
    .col-2 {{ lang.rewards }}
  q-scroll-area(:style="blocksListStyle")
    transition-group(
      appear
      enter-active-class="animated slideInTop "
      name="list"
    )
      .bg-white(:key="block.time" v-for="block of farmedBlocksList")
        q-separator
        .row.q-gutter-sm.q-pa-xs.q-ml-sm
          .col-3.ellipsis
            p {{ block.author.substring(0, 9) + '...' + block.author.substring(block.author.length - 9, block.author.length - 1) }}
          .col-1
            p {{ block.blockNum }}
          .col-4
            p {{ new Date(block.time).toLocaleString() }}
          .col-2
            p {{ block.blockReward }} tSSC
          .col-auto
            q-btn(color="grey" flat icon="info" size="sm")
</template>

<script lang="ts">
import { defineComponent } from "vue"
import * as util from "src/lib/util"
import { globalState as global } from "src/lib/global"
import { FarmedBlock } from "src/lib/types"

const lang = global.data.loc.text.dashboard

export default defineComponent({
  props: {
    expanded: { type: Boolean, default: false },
    farmedTotalEarned: { type: Number, default: 0 }
  },
  emits: ["expand"],
  data() {
    return { lang, util, global: global.data, client: global.client }
  },
  computed: {
    farmedBlocksList(): FarmedBlock[] {
      return this.client?.data?.farming.farmed || []
    },
    blocksListStyle(): { [index: string]: string } {
      return this.expanded ? { height: "370px" } : { height: "185px" }
    } 
  }
})
</script>
