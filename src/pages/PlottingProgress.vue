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
            input-class="plottingInput"
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
            v-if="!plotFinished"
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
            input-class="plottingInput"
            outlined
            readonly
            suffix="GB"
            v-model="plottingData.finishedGB"
          )
          .q-mt-sm {{ lang.remaining }}
          q-input.bg-white(
            dense
            input-class="plottingInput"
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
            input-class="plottingInput"
            outlined
            readonly
            v-model="printElapsedTime"
          )
          .q-mt-sm {{ lang.remainingTime }}
          q-input.bg-white(
            dense
            input-class="plottingInput"
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
        :disable="!plotFinished"
      )
      q-tooltip.q-pa-md(v-if="!plotFinished")
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
import * as util from "src/lib/util"
import introModal from "components/introModal.vue"

const lang = global.data.loc.text.plottingProgress
let farmerTimer: number

export default defineComponent({
  data() {
    return {
      lang,
      elapsedms: 0,
      remainingms: 0,
      plottingData: {
        finishedGB: 0,
        remainingGB: 0,
        allocatedGB: 0,
        status: lang.fetchingPlot
      },
      client: global.client,
      viewedIntro: false,
      plotFinished: false,
      localSegIndex: 0,
      netSegIndex: 0,
      plotDirectory: ""
    }
  },
  computed: {
    progresspct(): number {
      const progress = parseFloat(
        ((this.localSegIndex * 100) / this.netSegIndex).toFixed(2)
      )
      return isNaN(progress) ? 0 : progress <= 100 ? progress : 100
    },
    remainingTime(): number {
      const ms =
        (this.elapsedms * this.netSegIndex) / this.localSegIndex -
        this.elapsedms
      this.changes(ms)
      return util.toFixed(ms > this.remainingms ? this.remainingms : ms, 2)
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
    localSegIndex(localIndex) {
      if (localIndex >= this.netSegIndex)
        this.plottingData.status = `Archived ${localIndex} Segments`
      else
        this.plottingData.status = `Archived ${localIndex} of ${this.netSegIndex} Segments`

      this.plottingData.finishedGB =
        (localIndex * this.plottingData.allocatedGB) / this.netSegIndex
    }
  },
  async mounted() {
    await this.getPlotConfig()
    await this.waitNode()
    this.startPlotting()
  },
  unmounted() {
    if (farmerTimer) clearInterval(farmerTimer)
  },
  methods: {
    changes(rMs: number) {
      this.remainingms = rMs
    },
    async getPlotConfig() {
      try {
        this.client.setFirstLoad()
        const appDir = await util.getAppDir()
        const config = await util.config.read(appDir)
        this.plottingData.remainingGB = config.utilCache.allocatedGB
        this.plottingData.allocatedGB = config.utilCache.allocatedGB
        this.plotDirectory = config.plot.location
      } catch (e) {
        console.error("PLOT PROGRESS getPlotConfig | ERROR", e)
      }
    },
    async waitNode() {
      const { publicKey } = await this.client.waitNodeStartApiConnect(
        this.plotDirectory
      )
      const config = await util.config.read(this.plotDirectory)

      if (publicKey && config) {
        await util.config.update(
          {
            ...config,
            plot: {
              location: this.plotDirectory,
              nodeLocation: this.plotDirectory
            },
            account: {
              farmerPublicKey: publicKey.toString(),
              passHash: config.account.passHash
            }
          },
          this.plotDirectory
        )
      }
    },
    pausePlotting() {
      this.plotFinished = true
      clearInterval(farmerTimer)
    },
    async farmingWrapper(): Promise<void> {
      await this.client.startBlockSubscription()

      this.plottingData.status = lang.startingFarmer
      farmerTimer = window.setInterval(() => (this.elapsedms += 1000), 1000)
      await this.client.startFarming(this.plotDirectory)
      this.plottingData.status = lang.fetchingPlot
    },
    async nodeSyncWrapper(): Promise<void> {
      let blockNumberData = await this.client.getBlocksData()
      do {
        this.plottingData.status = `Syncing node ${blockNumberData[0].toLocaleString()} of ${blockNumberData[1].toLocaleString()} Blocks`
        await new Promise((resolve) => setTimeout(resolve, 3000))
        blockNumberData = await this.client.getBlocksData()
      } while (blockNumberData[0] < blockNumberData[1])
    },
    async startPlotting() {
      // let blockNumberData = await this.client.getBlocksData()
      // do {
      //   this.plottingData.status = `Syncing node ${blockNumberData[0].toLocaleString()} of ${blockNumberData[1].toLocaleString()} Blocks`
      //   await new Promise((resolve) => setTimeout(resolve, 3000))
      //   blockNumberData = await this.client.getBlocksData()
      // } while (blockNumberData[0] < blockNumberData[1])

      // await this.client.startBlockSubscription()

      // this.plottingData.status = lang.startingFarmer
      // farmerTimer = window.setInterval(() => (this.elapsedms += 1000), 1000)
      // await this.client.startFarming(this.plotDirectory)
      // this.plottingData.status = lang.fetchingPlot

      await Promise.all([this.farmingWrapper(), this.nodeSyncWrapper()]);

      const { utilCache } = await util.config.read(this.plotDirectory)
      this.netSegIndex = utilCache.lastNetSegmentIndex
      this.plottingData.allocatedGB = utilCache.allocatedGB

      this.localSegIndex = await this.client.getLocalFarmerSegmentIndex()
      do {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        this.localSegIndex = await this.client.getLocalFarmerSegmentIndex()
      } while (this.localSegIndex < this.netSegIndex)

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
.plottingInput
  font-size: 20px
  padding-top: 5px
  margin-top: 0px
</style>
