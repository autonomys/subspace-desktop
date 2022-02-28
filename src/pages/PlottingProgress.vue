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
          div {{ lang.plotsDirectory }}
          q-input(
            dense
            input-class="pkdisplay"
            outlined
            readonly
            v-model="plotDirectory"
          )
      .row.items-center.q-gutter-md
        .col.relative-position
          q-linear-progress.rounded-borders(
            :value="progresspct / 100"
            rounded
            style="height: 40px"
            track-color="blue-2"
          )
            .absolute-full.flex.flex-center
              q-badge(color="white" size="lg" text-color="black")
                template(v-slot:default)
                  .q-pa-xs(style="font-size: 18px" v-if="progresspct > 0") {{ progresspct }}%
                  .q-pa-xs(style="font-size: 14px") {{ plottingData.status }}
          q-linear-progress.absolute-right(
            :value="0.9"
            indeterminate
            style="height: 1px; top: 39px"
            track-color="transparent"
            v-if="plotting"
          )
      .row.justify-center.q-gutter-md.q-pt-md
        .col-1
        .col-3.relative-position
          q-icon.absolute(
            color="blue-1"
            name="downloading"
            size="180px"
            style="z-index: -100; right: 100px"
          )
          .q-mt-sm {{ lang.plotted }}
          q-input.bg-white(
            dense
            input-class="pkdisplay"
            outlined
            readonly
            suffix="GB"
            v-model="plottingData.finishedGB"
          )
          .q-mt-sm {{ lang.remaining }}
          q-input.bg-white(
            dense
            input-class="pkdisplay"
            outlined
            readonly
            suffix="GB"
            v-model="plottingData.remainingGB"
          )
        .col-2
        .col-3.relative-position
          q-icon.absolute(
            color="blue-1"
            name="schedule"
            size="180px"
            style="z-index: -100; right: 100px"
          )
          .q-mt-sm {{ lang.elapsedTime }}
          q-input.bg-white(
            dense
            input-class="pkdisplay"
            outlined
            readonly
            v-model="printElapsedTime"
          )
          .q-mt-sm {{ lang.remainingTime }}
          q-input.bg-white(
            dense
            input-class="pkdisplay"
            outlined
            readonly
            v-model="printRemainingTime"
          )

  .row.justify-end.q-mt-lg.absolute-bottom.q-pb-lg
    .col-auto.q-ml-xl.q-pr-md
      div {{ lang.hint }}
    .col.q-pr-md
      div {{ lang.hintInfo }}
    .col-auto.q-pr-md
    .col-expand
    .col-auto(v-if="viewedIntro")
      q-btn(
        :label="lang.next"
        @click="$router.replace({ name: 'dashboard' })"
        color="blue-8"
        icon-right="play_arrow"
        outline
        size="lg"
        :disable="!farmStarted"
      )
      q-tooltip.q-pa-md(v-if="!farmStarted")
        p.q-mb-lg {{ lang.waitPlotting }}
    .col-auto(v-else)
      q-btn(
        :label="lang.next"
        @click="viewIntro()"
        color="blue-8"
        icon-right="play_arrow"
        outline
        size="lg"
      )
</template>

<script lang="ts">
import { defineComponent } from "vue"
import { globalState as global } from "src/lib/global"
const lang = global.data.loc.text.plottingProgress
import * as util from "src/lib/util"
import introModal from "components/introModal.vue"
import TimeAgo from "javascript-time-ago"
import en from "javascript-time-ago/locale/en"
import { startFarming, getLocalFarmerSegmentIndex } from "src/lib/client"
TimeAgo.addLocale(en)
let timer: number

export default defineComponent({
  data() {
    return {
      elapsedms: 0,
      remainingms: 0,
      plotting: true,
      plottingData: {
        finishedGB: 0,
        remainingGB: 0,
        allocatedGB: 0,
        status: lang.fetchingPlot
      },
      client: global.client,
      viewedIntro: false,
      lang,
      plotFinished: false,
      farmStarted: false,
      lastLocalSegmentIndex: 0,
      lastNetSegmentIndex: 0,
      plotDirectory: ""
    }
  },
  computed: {
    progresspct(): number {
      const progress = parseFloat(
        ((this.lastLocalSegmentIndex * 100) / this.lastNetSegmentIndex).toFixed(
          2
        )
      )
      return isNaN(progress) ? 0 : progress <= 100 ? progress : 100
    },
    remainingTime(): number {
      const remainingTotalMs = ((this.elapsedms * this.lastNetSegmentIndex) / this.lastLocalSegmentIndex) - this.elapsedms
      const remainingTotal = util.toFixed(
        remainingTotalMs > this.remainingms ? this.remainingms : remainingTotalMs,
        2
      )
      this.changes(remainingTotalMs);
      return remainingTotal
    },
    printRemainingTime(): string {
      return this.plotFinished || this.elapsedms === 0
        ? util.formatMS(0)
        : util.formatMS(this.remainingTime)
    },
    printElapsedTime(): string {
      return util.formatMS(this.elapsedms)
    }
  },
  watch: {
    "plottingData.finishedGB"(val) {
      this.plottingData.finishedGB = parseFloat(
        this.plottingData.finishedGB.toFixed(2)
      )
      this.plottingData.remainingGB = parseFloat(
        (this.plottingData.allocatedGB - val).toFixed(2)
      )
      if (this.plottingData.finishedGB >= this.plottingData.allocatedGB)
        this.plottingData.finishedGB = this.plottingData.allocatedGB
    },

  },
  async mounted() {
    await this.getPlotConfig()
    this.startPlotting()
  },
  unmounted() {
    if (timer) clearInterval(timer)
  },
  methods: {
    changes(remainingTotalMs: number) {
      this.remainingms = remainingTotalMs;
    },
    async getPlotConfig() {
      try {
        const config = await util.config.read()
        if (!config.plot || !config.plot.sizeGB || !config.plot.location) {
          const modal = util.config.showErrorModal()
          modal.onOk(async () => {
            await util.config.clear()
            this.$router.replace({ name: "index" })
          })
          return
        }
        this.plottingData.remainingGB = config.plot.sizeGB
        this.plottingData.allocatedGB = config.plot.sizeGB
        this.plotDirectory = config.plot.location
      } catch (e) {
        console.log("PLOT PROGRESS CONFIG | ERROR", e)
        return
      }
    },
    startPlotting() {
      this.plotting = true
      this.plottingProgress()
    },
    pausePlotting() {
      this.plotting = false
      this.plotFinished = true
      clearInterval(timer)
    },
    async plottingProgress() {
      await this.client.validateApiStatus(true, true)
      // If the local node is Syncing. Must wait until done.
      let blockNumberData = await Promise.all([
        this.client.getLocalLastBlockNumber(),
        this.client.getNetworkLastBlockNumber()
      ])
      do {
        blockNumberData = await Promise.all([
          this.client.getLocalLastBlockNumber(),
          this.client.getNetworkLastBlockNumber()
        ])
        this.plottingData.status = `Syncing node ${blockNumberData[0].toLocaleString()} of ${blockNumberData[1].toLocaleString()} Blocks`
        await new Promise((resolve) => setTimeout(resolve, 1500))
      } while (blockNumberData[0] < blockNumberData[1])

      // Avoid user to get stuck in plotting progress page. After node is fully synced plot is started,
      // allow to move dashboard. Only if viewedIntro === true
      this.farmStarted = true

      // After local node is fully Synced, the farmer will be able to actualy plot and farm.
      this.plottingData.status = lang.startingFarmer

      await startFarming(this.plotDirectory)

      this.plottingData.status = lang.fetchingPlot
      timer = window.setInterval(() => (this.elapsedms += 1000), 1000)

      const { utilCache } = await util.config.read()
      this.lastNetSegmentIndex =
        utilCache?.lastNetSegmentIndex ||
        (await this.client.getNetworkSegmentIndex())
      this.lastLocalSegmentIndex = await getLocalFarmerSegmentIndex()

      const totalSize = this.lastNetSegmentIndex * 256 * util.PIECE_SIZE
      this.plottingData.allocatedGB =
        Math.round((totalSize * 100) / util.GB) / 100

      this.plotting = false
      do {
        this.lastLocalSegmentIndex = await getLocalFarmerSegmentIndex()
        this.plottingData.finishedGB =
          (this.lastLocalSegmentIndex * this.plottingData.allocatedGB) /
          this.lastNetSegmentIndex
        if (this.lastLocalSegmentIndex >= this.lastNetSegmentIndex)
          this.plottingData.status = `Archived ${this.lastLocalSegmentIndex} Segments`
        else
          this.plottingData.status = `Archived ${this.lastLocalSegmentIndex} of ${this.lastNetSegmentIndex} Segments`
        await new Promise((resolve) => setTimeout(resolve, 2000))
      } while (this.lastLocalSegmentIndex < this.lastNetSegmentIndex)

      this.pausePlotting()
    },
    async viewIntro() {
      const modal = await util.showModal(introModal)
      modal?.onDismiss(() => {
        this.viewedIntro = true
      })
    }
  }
})
</script>
<style lang="sass">
.pkdisplay
  font-size: 20px
  padding-top: 5px
  margin-top: 0px
</style>
