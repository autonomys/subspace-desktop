<template lang="pug">
q-page.q-pl-xl.q-pr-xl.q-pt-md
  .row.justify-center
    //- h4 {{ lang.pageTitle }}
  .row.q-pb-sm.justify-center
    .row
      .col-auto.q-mr-md.relative-position
        q-icon(color="green-5" name="trip_origin" size="60px" style="bottom: 5px; right: 5px")
        //- q-spinner-oval(color="green" size="55px")
      .col
        .text-weight-light Farmer Status:
        h6.no-margin Connected Synced and Farming
  .row.q-gutter-md
    .col
      q-card(bordered flat)
        .q-pa-sm
          .row.items-center
            q-icon.q-mr-sm(color="grey" name="downloading" size="40px")
            h6.text-weight-light Plot
          q-separator.q-mt-xs
          .row.items-center.q-mt-sm
            .col-auto.q-mr-md
              q-icon(color="green" name="done" size="40px")
            .col
              .text-weight-light Status:
              p 100% plotted
          .row.items-center.q-mt-sm
            .col-auto.q-mr-md
              q-icon(color="black" name="storage" size="40px")
            .col
              .text-weight-light Allocated:
              p 3000 GB
    .col
      q-card(bordered flat)
        .q-pa-sm
          .row.items-center
            q-icon.q-mr-sm(color="grey" name="settings_ethernet" size="40px")
            h6.text-weight-light Network
          q-separator.q-mt-xs
          .row.items-center.q-mt-sm
            .col-auto.q-mr-md
              q-icon(color="green" name="done" size="40px")
            .col
              .text-weight-light Status:
              p Connected to 10 peers
          .row.items-center.q-mt-sm
            .col
              .row.items-center
                .col-auto.q-mr-md
                  q-icon(color="black" name="north" size="40px")
                .col
                  .text-weight-light Uploaded:
                  p 36 GB
            .col
              .row.items-center
                .col-auto.q-mr-md
                  q-icon(color="black" name="south" size="40px")
                .col
                  .text-weight-light Downloaded:
                  p 3600 GB
  .row.q-gutter-md.q-pt-md
    .col
      q-card(bordered flat)
        .q-pa-sm
          .row.q-gutter-md.items-center
            .col-auto
              .row
                q-icon.q-mr-sm(color="grey" name="grid_view" size="40px")
                h6.text-weight-light Mined Blocks
            .col-auto
              .text-weight-light Total Mined
              p 10
            .col-auto
              .text-weight-light Total Earned
              p 12234.23 SSC
            q-space
            .col.col-auto
              //- .row
              .row.justify-center
                q-btn(color="grey-10" flat icon-right="list" label="View All" size="md" stretch)

        q-separator
        .row.q-gutter-sm.q-pa-md
          .col-2 Block Number
          .col-4 Time
          .col-2 # Transactions
          .col-3 Block Reward + Fees
        q-separator
        .row.q-gutter-sm.q-pa-xs.q-ml-sm
          .col-2
            p 32434324
          .col-auto
            q-separator(vertical)
          .col-4
            p {{ new Date().toLocaleString() }}
          .col-2
            p 5
          .col-3
            p 343.23 SSC
        q-separator
        .row.q-gutter-sm.q-pa-xs.q-ml-sm
          .col-2
            p 32434324
          .col-auto
            q-separator(vertical)
          .col-4
            p {{ new Date().toLocaleString() }}
          .col-2
            p 5
          .col-3
            p 343.23 SSC
        q-separator
        .row.q-gutter-sm.q-pa-xs.q-ml-sm
          .col-2
            p 32434324
          .col-auto
            q-separator(vertical)
          .col-4
            p {{ new Date().toLocaleString() }}
          .col-2
            p 5
          .col-3
            p 343.23 SSC
</template>

<script lang="ts">
import { defineComponent } from "vue"
import * as global from "src/lib/global"
const lang = global.data.loc.text.dashboard

export default defineComponent({
  data() {
    return { lang }
  },
})
</script>

<style lang="sass">
</style>