<template lang="pug">
q-page.q-pa-lg.q-mr-lg.q-ml-lg
  .row.justify-center.q-mb-md
    .text-h4 {{ lang.pageTitle }}
  .row.justify-center
    p {{ lang.infoDialog }}
  //- .row.justify-center.q-mb-md
    //- .text-h6 Plot Directory
  .row.justify-center.q-mr-lg.q-ml-lg
    .col
      .row
        .col-10
          div Plots Directory
          q-input.q-field--highlighted(color="blue" input-class="pkdisplay" outlined v-model="plotDirectory")
        .col(style="padding-top: 20px")
          q-btn(color="blue" flat icon="folder" size="lg" style="height: 55px")
      .row.items-center.q-gutter-md
        .col-4
          .row
            .col.q-pr-md
              .q-mt-sm Utilized
              q-input(dense input-class="pkdisplay" outlined readonly suffix="GB" v-model="utilizedGB")
              .q-mt-sm Free
              q-input(dense input-class="pkdisplay" outlined readonly suffix="GB" v-model="freeGB")
              .q-mt-sm Allocated for Plots
              q-input.q-field--highlighted(color="blue" input-class="pkdisplay" outlined suffix="GB" type="number" v-model="allocatedGB")
        .col.q-pr-md
          .row.justify-center
            .relative-position(style="height: 145px; width: 170px")
              q-circular-progress.absolute-center(:thickness="0" :value="0" center-color="grey-4" size="120px")
              q-circular-progress.absolute-center(:angle="diskPercentUsed * 3" :thickness="0.5" :value="allocatedGBChart" center-color="grey-3" color="blue" size="120px")
              q-circular-progress.absolute-center(:thickness="0.5" :value="diskPercentUsed" center-color="grey-3" color="grey-9" size="120px")
          .row.q-mt-lg
            .col-1
            .col
              q-slider(:max="safeAvailableGB" :min="0" :step="100" color="blue" markers snap style="height: 25px" v-model="allocatedGB")
            .col-1
  .row.justify-end.q-mt-lg.absolute-bottom.q-pb-lg
    .col-auto.q-ml-xl.q-pr-md
      div Hint:
    .col.q-pr-md
      //- small Hint:
      div Increasing your plots size will improve Farmer profitability.
      //- div(style="height: 10px")
    .col-auto.q-pr-md
      div Initial Plotting time:
      div(style="font-size: 20px") 4 hours
    .col-expand
    .col-auto
      q-btn(:disable="!canContinue" color="blue-8" icon-right="downloading" label="Start Plotting" outline size="lg")
      q-tooltip.q-pa-md(v-if="!canContinue")
        p.q-mb-lg {{ lang.tooltip }}
</template>

<style lang="sass">
.pkdisplay
  font-size: 20px
  padding-top: 5px
  margin-top: 0px
</style>

<script lang="ts">
import { defineComponent } from "vue"
import { setupPlot as lang } from "src/loc/en"
import { QInput, Dialog, Notify } from "quasar"

export default defineComponent({
  name: "PageIndex",
  data() {
    let userConfirm: boolean = false
    let generatedPk = "98da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8f"
    let revealKey = false
    let allocatedGB = 100
    let plotDirectory = "/Subspace/plots"
    return { revealKey, userConfirm, lang, generatedPk, plotDirectory, allocatedGB }
  },
  computed: {
    totalDiskSizeGB(): number {
      return 4000
    },
    diskPercentAvailable(): number {
      return (this.safeAvailableGB / this.totalDiskSizeGB) * 100
    },
    diskPercentUsed(): number {
      return 100 - this.diskPercentAvailable
    },
    allocatedGBChart(): number {
      return (this.allocatedGB / this.safeAvailableGB) * 100
    },
    safeAvailableGB(): number {
      return 3500
    },
    utilizedGB(): number {
      return this.totalDiskSizeGB - this.safeAvailableGB
    },
    freeGB(): number {
      return this.safeAvailableGB - this.allocatedGB
    },
    canContinue(): boolean {
      return this.allocatedGB > 100
    },
  },
  methods: {
    copyPk() {
      const displaypk = this.$refs["pkDisplay"] as QInput
      const previousState = this.revealKey
      this.revealKey = true
      this.$nextTick(() => {
        displaypk.focus()
        displaypk.select()
        var successful = document.execCommand("copy")
        var msg = successful ? "successful" : "unsuccessful"
        console.log(msg)
        this.revealKey = previousState
        // Dialog.create({ message: "Private Key copied to clipboard" })
        Notify.create({ message: "Private Key copied to clipboard. Backup key in a secure location.", icon: "content_copy" })
      })
    },
  },
})
</script>
