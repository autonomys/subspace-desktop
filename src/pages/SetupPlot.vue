<template lang="pug">
q-page.q-pa-lg.q-mr-lg.q-ml-lg
  .row.justify-center
    h4 {{ lang.pageTitle }}
  .row.justify-center
    p {{ lang.infoDialog }}
  //- .row.justify-center.q-mb-md
    //- .text-h6 Plot Directory
  .row.justify-center.q-mr-lg.q-ml-lg
    .col
      .row.items-center
        .col-10
          div Plots Directory
          q-input(input-class="pkdisplay" outlined v-model="plotDirectory")
        .col
          q-btn(flat icon="folder" size="lg" style="height: 55px")
      .row.items-center.q-gutter-md.q-pt-sm
        .col-4
          .row
            .col.q-pr-md
              div Allocated Space
              q-input(input-class="pkdisplay" outlined suffix="GB" type="number" v-model="allocatedGB")
              .q-mt-sm Remaining Free Space
              q-input(input-class="pkdisplay" outlined readonly suffix="GB" v-model="freeGB")
        .col.q-pr-md
          .row.justify-center
            .q-mt-md.relative-position(style="height: 70px; width: 70px")
              q-circular-progress.absolute-center(:angle="diskPercentUsed * 3" :thickness="0.5" :value="allocatedGBChart" center-color="grey-3" color="blue" size="60px")
              q-circular-progress.absolute-center(:thickness="0.5" :value="diskPercentUsed" center-color="grey-3" color="green" size="60px")
          .row.q-mt-lg
            .col-1
            .col
              q-slider(:max="safeAvailableGB" :min="0" :step="100" color="blue" markers snap style="height: 20px" v-model="allocatedGB")
            .col-1
  .row.justify-end.items-center.q-mt-lg.absolute-bottom.q-pb-lg
    .col-auto.q-pr-md
      div Initial Plotting time:
      div(style="font-size: 20px") 4 hours
    .col-auto.q-pr-md
      div Total Disk Usage:
      div(style="font-size: 20px") {{ allocatedGB }} GB
    .col-expand
    .col-auto
      q-btn(:disable="!canContinue" color="blue-8" icon-right="downloading" label="Start Plotting" outline size="lg")
      q-tooltip.q-pa-md(v-if="!canContinue")
        p.q-mb-md {{ lang.tooltip }}
</template>

<style lang="sass">
.pkdisplay
  font-size: 20px
  padding-top: 0px
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
    freeGB(): number {
      return this.safeAvailableGB - this.allocatedGB
    },
    canContinue(): boolean {
      return this.userConfirm
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
