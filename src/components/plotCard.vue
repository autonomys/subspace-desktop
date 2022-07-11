<template lang="pug">
q-card(bordered flat)
  .q-pa-sm
    .row.items-center
      q-icon.q-mr-sm(color="grey" name="downloading" size="40px")
      h6.text-weight-light {{ $t('dashboard.plot') }}
    q-separator.q-mt-xs
    .row.items-center.q-mt-sm
      .col-auto.q-mr-md(v-if="plot.state == 'finished'")
        q-icon(color="green" name="done" size="40px")
      .col-auto.q-mr-md(v-if="plot.state == 'downloading'")
        q-spinner-box(color="green" size="40px")
      .col-auto.q-mr-md(v-if="plot.state == 'verifying'")
        q-spinner-box(color="grey" size="40px")
      .col
        .text-weight-light {{ $t('dashboard.status') }}
        p {{ plot.message }}
    .row.items-center.q-mt-sm
      .col-auto.q-mr-md
        q-icon(color="black" name="storage" size="40px")
      .col
        .text-weight-light {{ $t('dashboard.allocated') }}
        p {{ plot.plotSizeGB }} GB
</template>

<script lang="ts" >
import { defineComponent } from "vue"
import * as util from "../lib/util"

export default defineComponent({
  props: {
    plot: { type: Object, required: true }
  },
  data() {
    return { util }
  }
})
</script>
