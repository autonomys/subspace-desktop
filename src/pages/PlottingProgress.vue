<template lang="pug">
q-page.q-pa-lg.q-mr-lg.q-ml-lg
  .row.justify-center.q-mb-md
    .text-h4 {{ lang.pageTitle }}
  .row.justify-center
    p {{ lang.infoDialog }}
  .row.justify-center.q-mr-lg.q-ml-lg
    .col
      .row
        .col
          div {{ lang.plotsDirectory }}
          q-input(dense input-class="pkdisplay" outlined readonly v-model="plotDirectory")
      .row.items-center.q-gutter-md
        .col.relative-position
          q-linear-progress.rounded-borders(:value="progresspct / 100" rounded style="height: 40px" track-color="blue-2")
            .absolute-full.flex.flex-center
              q-badge(color="white" size="lg" text-color="black")
                template(v-slot:default)
                  .q-pa-xs(style="font-size: 18px") {{ progresspct }}%
          q-linear-progress.absolute-right(:value="0.9" indeterminate style="height: 4px; top: 36px" track-color="transparent" v-if="plotting")
      .row.justify-center.q-gutter-md.q-pt-md
        .col-1
        .col-3.relative-position
          q-icon.absolute(color="blue-1" name="downloading" size="180px" style="z-index: -100; right: 100px")
          .q-mt-sm {{ lang.plotted }}
          q-input.bg-white(dense input-class="pkdisplay" outlined readonly suffix="GB" v-model="plottingData.finishedGB")
          .q-mt-sm {{ lang.remaining }}
          q-input.bg-white(dense input-class="pkdisplay" outlined readonly suffix="GB" v-model="plottingData.remainingGB")
        .col-2
        .col-3.relative-position
          q-icon.absolute(color="blue-1" name="schedule" size="180px" style="z-index: -100; right: 100px")
          .q-mt-sm {{ lang.elapsedTime }}
          q-input.bg-white(dense input-class="pkdisplay" outlined readonly v-model="printElapsedTime")
          .q-mt-sm {{ lang.remainingTime }}
          q-input.bg-white(dense input-class="pkdisplay" outlined readonly v-model="printRemainingTime")
  .row.justify-end.q-mt-lg.absolute-bottom.q-pb-lg
    .col-auto.q-ml-xl.q-pr-md
      div {{ lang.hint }}
    .col.q-pr-md
      div {{ lang.hintInfo }}
    .col-auto.q-pr-md
    .col-expand
    .col-auto
      q-btn.q-mr-md(@click="fakeProgress()" flat icon="arrow_right" round size="sm")
      q-btn(@click="pausePlotting(false)" color="blue-8" icon-right="play_arrow" label="Resume Plotting" outline size="lg" v-if="!plotting")
      q-btn(@click="pausePlotting(true)" color="blue-8" icon-right="pause" label="Pause Plotting" outline size="lg" v-else)
</template>

<style lang="sass">
.pkdisplay
  font-size: 20px
  padding-top: 5px
  margin-top: 0px
</style>

<script lang="ts">
import { defineComponent } from "vue"
// import { plottingProgress as lang } from "src/loc/en"
import { QInput, Dialog, Notify } from "quasar"
import { data as gData, mutations as gMut } from "src/lib/global"
const lang = gData.lang.plottingProgress

import TimeAgo from "javascript-time-ago"
import en from "javascript-time-ago/locale/en"
TimeAgo.addDefaultLocale(en)
const timeAgo = new TimeAgo("en-US")

export default defineComponent({
  data() {
    let plottingData = {
      finishedGB: 10.2,
      remainingGB: 32.3,
    }
    return {
      plotting: true,
      plottingData,

      lang,
      plotDirectory: "/Subspace/plots",
      allocatedGB: 100,
      progresspct: 20,
    }
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
    canContinue(): boolean {
      return this.allocatedGB > 100
    },
  },
  methods: {
    pausePlotting(plotting: boolean) {
      this.plotting = !plotting
    },
    fakeProgress() {
      if (!this.plotting) return
      this.progresspct += 10
    },
  },
  watch: {
    progresspct() {
      if (this.progresspct >= 100) this.$router.replace({ name: "dashboard" })
    },
  },
})
</script>
