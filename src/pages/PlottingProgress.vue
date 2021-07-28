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
        .col
          div Plots Directory
          q-input(dense input-class="pkdisplay" outlined readonly v-model="plotDirectory")
      .row.items-center.q-gutter-md
        .col.relative-position
          q-linear-progress.rounded-borders(:value="0.2" animated stripe style="height: 40px" track-color="blue-2")
            .absolute-full.flex.flex-center
              q-badge(color="white" size="lg" text-color="black")
                template(v-slot:default)
                  .q-pa-xs(style="font-size: 18px") 20%
          q-linear-progress.absolute-right(:value="0.9" color="blue-4" indeterminate style="height: 4px; width: 80%; top: 36px" track-color="blue-2")
      .row.justify-center.q-gutter-md.q-pt-md
        .col-1
        .col-3.relative-position
          q-icon.absolute(color="grey-3" name="downloading" size="180px" style="z-index: -100; right: 100px")
          .q-mt-sm Plotted
          q-input.bg-white(dense input-class="pkdisplay" outlined readonly suffix="GB" v-model="utilizedGB")
          .q-mt-sm Remaining
          q-input.bg-white(dense input-class="pkdisplay" outlined readonly suffix="GB" v-model="utilizedGB")
        .col-2
        .col-3.relative-position
          q-icon.absolute(color="grey-3" name="schedule" size="180px" style="z-index: -100; right: 100px")
          .q-mt-sm Elapsed Time
          q-input.bg-white(dense input-class="pkdisplay" outlined readonly v-model="printElapsedTime")
          .q-mt-sm Remaining Time
          q-input.bg-white(dense input-class="pkdisplay" outlined readonly v-model="printRemainingTime")
  .row.justify-end.q-mt-lg.absolute-bottom.q-pb-lg
    .col-auto.q-ml-xl.q-pr-md
      div Hint:
    .col.q-pr-md
      //- small Hint:
      div Join the Subspace Discord while you wait, meet the community and earn some SSC
      //- div(style="height: 10px")
    .col-auto.q-pr-md
      //- div Initial plotting time:
      //- div(style="font-size: 20px") {{ printEstimatedTime }}
    .col-expand
    .col-auto
      q-loading
      q-btn(:disable="!canContinue" color="blue-8" icon-right="pause" label="Pause Plotting" outline size="lg")
      q-tooltip.q-pa-md(v-if="!canContinue")
        //- p.q-mb-lg {{ lang.tooltip }}
</template>

<style lang="sass">
.pkdisplay
  font-size: 20px
  padding-top: 5px
  margin-top: 0px
</style>

<script lang="ts">
import { defineComponent } from "vue"
import { plottingProgress as lang } from "src/loc/en"
import { QInput, Dialog, Notify } from "quasar"
import TimeAgo from "javascript-time-ago"
import en from "javascript-time-ago/locale/en"
TimeAgo.addDefaultLocale(en)
const timeAgo = new TimeAgo("en-US")

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
    remainingTimeHr(): number {
      return 12
    },
    printRemainingTime(): string {
      return timeAgo.format(Date.now() + this.remainingTimeHr * 3600000, "long").split("in")[1]
    },
    printElapsedTime(): string {
      return timeAgo.format(Date.now() + this.elapsedTimeHr * 3600000, "long").split("in")[1]
    },
    elapsedTimeHr(): number {
      return 4
    },
    printEstimatedTime(): string {
      return timeAgo.format(Date.now() + this.plotTimeHr * 3600000, "long").split("in")[1]
    },
    plotTimeHr(): number {
      return this.allocatedGB * 0.1
    },
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
