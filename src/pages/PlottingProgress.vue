<template lang="pug">
q-page.q-pa-lg.q-mr-lg.q-ml-lg
  .row.justify-center.q-mb-md
    .text-h4 {{ lang.pageTitle }}
  .row.justify-center
    p {{ lang.infoDialog }}
  .row.justify-center.q-mr-lg.q-ml-lg
    .col
      .row
        .col.q-mt-sm
          div {{ lang.plotsDirectory }} {{ plotFinished }}
          q-input(dense input-class="pkdisplay" outlined readonly v-model="plotDirectory")
      .row.items-center.q-gutter-md
        .col.relative-position
          q-linear-progress.rounded-borders(:value="progresspct / 100" rounded style="height: 40px" track-color="blue-2")
            .absolute-full.flex.flex-center
              q-badge(color="white" size="lg" text-color="black")
                template(v-slot:default)
                  .q-pa-xs(style="font-size: 18px") {{ progresspct }}%
          q-linear-progress.absolute-right(:value="0.9" indeterminate style="height: 1px; top: 39px" track-color="transparent" v-if="plotting")
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
    .col-auto(v-if="viewedIntro")
      q-btn(:label="lang.finish" @click="$router.replace({ name: 'dashboard' })" color="blue-8" icon-right="play_arrow" outline size="lg" v-if="plotFinished")
      q-btn(:label="lang.resume" @click="startPlotting()" color="blue-8" icon-right="play_arrow" outline size="lg" v-else-if="!plotting")
      q-btn(:label="lang.pause" @click="pausePlotting()" color="blue-8" icon-right="pause" outline size="lg" v-else)
    .col-auto(v-else)
      q-btn(:label="lang.next" @click="viewIntro()" color="blue-8" icon-right="play_arrow" outline size="lg")
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
import * as global from "src/lib/global"
const lang = global.data.loc.text.plottingProgress
import * as util from "src/lib/util"
import introModal from "components/introModal.vue"
import TimeAgo from "javascript-time-ago"
import en from "javascript-time-ago/locale/en"
TimeAgo.addLocale(en)
const timeAgo = new TimeAgo("en-US")
let interval
let timer

export default defineComponent({
  data() {
    let plottingData = {
      finishedGB: 0,
      remainingGB: 0,
    }

    return {
      elapsedms: 0,
      plotting: true,
      plottingData,
      viewedIntro: false,
      lang,
      plotFinished: false,
      plotDirectory: "/Subspace/plots",
      allocatedGB: 0,
    }
  },
  async mounted() {
    await this.getPlotConfig()
    this.startPlotting()
  },
  computed: {
    progresspct(): number {
      return parseFloat(((this.plottingData.finishedGB / this.allocatedGB) * 100).toFixed(2))
    },
    remainingTime(): number {
      return util.toFixed(((this.plotTimeEstimate - this.elapsedTime) / this.progresspct) * 2, 2)
    },
    printRemainingTime(): string {
      return this.plotFinished ? util.formatMS(0) : util.formatMS(this.remainingTime)
    },
    printElapsedTime(): string {
      return util.formatMS(this.elapsedms)
    },
    elapsedTime(): number {
      return this.elapsedms
    },
    plotTimeEstimate(): number {
      return util.plotTimeMsEstimate(this.allocatedGB)
    },
    totalDiskSizeGB(): number {
      return 4000
    },
  },
  unmounted() {
    if (interval) clearInterval(interval)
    if (timer) clearInterval(timer)
  },
  methods: {
    async getPlotConfig() {
      const config = await util.config.read()
      console.log(config)

      if (!config.plot || !config.plot.sizeGB || !config.plot.location) {
        const modal = util.config.showErrorModal()
        modal.onOk(async () => {
          await util.config.clear()
          this.$router.replace({ name: "index" })
        })
        return
      }
      console.log(config)
      this.allocatedGB = config.plot.sizeGB
      this.plotDirectory = config.plot.location
    },
    startPlotting() {
      this.plotting = true
      this.fakeProgress()
      timer = setInterval(() => (this.elapsedms += 100), 100)
    },
    pausePlotting() {
      this.plotting = false
      clearInterval(interval)
      clearInterval(timer)
    },
    async fakeProgress() {
      interval = setInterval(() => {
        this.plottingData.finishedGB += util.random(0, 50) / 40
        console.log(this.plottingData)
        if (this.plottingData.finishedGB >= this.allocatedGB) this.pausePlotting()
      }, util.random(200, 1000))
    },
    async viewIntro() {
      const modal = await util.showModal(introModal)
      modal?.onDismiss(() => {
        this.viewedIntro = true
      })
    },
  },
  watch: {
    "plottingData.finishedGB"(val) {
      this.plottingData.finishedGB = parseFloat(this.plottingData.finishedGB.toFixed(2))
      this.plottingData.remainingGB = parseFloat((this.allocatedGB - val).toFixed(2))
      if (this.plottingData.finishedGB >= this.allocatedGB) {
        this.plotFinished = true
        this.plottingData.finishedGB = this.allocatedGB
      }
    },
  },
})
</script>
