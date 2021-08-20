<template lang="pug">
q-card(bordered flat)
  .q-pa-sm
    .row.items-center
      .col-auto.q-mr-sm
        .row.items-center
          q-icon.q-mr-sm(color="grey" name="grid_view" size="40px")
          .text-h6.text-weight-light {{ lang.farmedBlocks }}:
      .col-auto.q-mr-md
        h6 {{ minedBlocksList?.length }}
      .col-auto.q-mr-md
        .text-weight-light Total Earned
        p {{ minedTotalEarned }} SSC
      q-space
      .col.col-auto
        //- .row
        .row.justify-center
          q-btn(@click="$emit('expand', true)" color="grey-10" flat icon-right="list" size="md" stretch v-if="!expanded")
          q-btn(@click="$emit('expand', false)" color="grey-10" flat icon-right="south" size="md" stretch v-else)

  q-separator
  .row.q-gutter-sm.q-pa-md
    .col-2 {{ lang.blockNum }}
    .col-4 {{ lang.time }}
    .col-2 {{ lang.transactions }}
    .col-3 {{ lang.rewards }}
  q-scroll-area(:style="blocksListStyle")
    transition-group(appear enter-active-class="animated slideInTop " name="list")
      .bg-white(:key="block.time" v-for="block of minedBlocksList")
        q-separator
        .row.q-gutter-sm.q-pa-xs.q-ml-sm
          .col-2
            p {{ block.blockNum }}
          .col-auto
            q-separator(vertical)
          .col-4
            p {{ new Date(block.time).toLocaleString() }}
          .col-2
            p {{ block.transactions }}
          .col-2
            p {{ block.blockReward }} SSC
          .col-expand
          .col
            .row.justify-end
              .col-auto
                q-btn(color="grey" flat icon="info" size="sm")
</template>df
<script lang="ts">
import { defineComponent, PropType } from "vue"
import * as util from "src/lib/util"
import * as global from "src/lib/global"
const lang = global.data.loc.text.dashboard
import { MinedBlock } from "src/lib/types"

export default defineComponent({
  emits: ["expand"],
  data() {
    return { lang, util }
  },
  props: {
    expanded: { type: Boolean, default: false },
    minedBlocksList: { type: Object as PropType<MinedBlock[]>, default: [] },
    minedTotalEarned: { type: Number, default: 0 },
  },
  computed: {
    blocksListStyle(): any {
      return this.expanded ? { height: "370px" } : { height: "185px" }
    },
  },
})
</script>
