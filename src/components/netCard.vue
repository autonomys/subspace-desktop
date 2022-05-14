<template lang="pug">
q-card(bordered flat)
  .q-pa-sm
    .row.items-center
      q-icon.q-mr-sm(color="grey" name="settings_ethernet" size="40px")
      h6.text-weight-light {{ lang.network }}
    q-separator.q-mt-xs
    .row.items-center.q-mt-sm
      .col-auto.q-mr-md(v-if="network.state == 'finished'")
        q-icon(color="green" name="done" size="40px")
      .col-auto.q-mr-md(v-if="network.state == 'verifying'")
        q-spinner-orbit(color="grey" name="done" size="40px")
      .col
        .text-weight-light Status:
        p {{ network.message }}
    .row.items-center.q-mt-sm
      .col
        .row.items-center
          .col-auto.q-mr-md
            q-icon(color="black" name="group" size="40px")
          .col
            .text-weight-light Peers:
            p {{ network.peers }}
    //-   .col
    //-     .row.items-center
    //-       .col-auto.q-mr-md
    //-         q-icon(color="black" name="south" size="40px")
    //-       .col
    //-         .text-weight-light Downloaded:
    //-         p 3600 GB
</template>

<script lang="ts" >
import { defineComponent } from "vue"
import * as util from "../lib/util"
import { globalState as global } from "../lib/global"

const lang = global.data.loc.text.dashboard

export default defineComponent({
  props: {
    network: { type: Object, required: true }
  },
  data() {
    return { lang, util }
  }
})
</script>


<style>
</style>
