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
                  .q-pa-xs(style="font-size: 18px") {{ progresspct }}%
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
        :disable="!plotFinished"
      )
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
      plotting: true,
      plottingData: {
        finishedGB: 0,
        remainingGB: 0,
        status: lang.fetchingPlot
      },
      client: global.client,
      viewedIntro: false,
      lang,
      plotFinished: false,
      plotDirectory: "",
      allocatedGB: 0
    }
  },
  computed: {
    progresspct(): number {
      return parseFloat(
        ((this.plottingData.finishedGB / this.allocatedGB) * 100).toFixed(2)
      )
    },
    remainingTime(): number {
      return util.toFixed(
        ((this.plotTimeEstimate - this.elapsedTime) / this.progresspct) * 2,
        2
      )
    },
    printRemainingTime(): string {
      return this.plotFinished
        ? util.formatMS(0)
        : util.formatMS(this.remainingTime)
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
    }
  },
  watch: {
    "plottingData.finishedGB"(val) {
      this.plottingData.finishedGB = parseFloat(
        this.plottingData.finishedGB.toFixed(2)
      )
      this.plottingData.remainingGB = parseFloat(
        (this.allocatedGB - val).toFixed(2)
      )
      if (this.plottingData.finishedGB >= this.allocatedGB) {
        this.plottingData.finishedGB = this.allocatedGB
      }
      // Avoid user to get stuck in plotting progress page. After node is fully synced plot is started, 
      // allow to move dashboard. Only if viewedIntro === true
      if(this.plottingData.finishedGB > 0)
        this.plotFinished = true
    }
  },
  async mounted() {
    await this.getPlotConfig()
    this.startPlotting()
  },
  unmounted() {
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
      this.plottingProgress()
    },
    pausePlotting() {
      this.plotting = false
      clearInterval(timer)
    },
    async plottingProgress() {
      await this.client.validateApiStatus()
      // If the local node is Syncing. Must wait until done.
      let blockNumberData = await Promise.all([
        this.client.getLocalLastBlockNumber(),
        this.client.getNetworkLastBlockNumber(),
      ])
      do {
        blockNumberData = await Promise.all([
          this.client.getLocalLastBlockNumber(),
          this.client.getNetworkLastBlockNumber(),
        ])
        this.plottingData.status = "Syncing node  " + blockNumberData[0].toLocaleString() + " of " + blockNumberData[1].toLocaleString() +" Blocks"
        await new Promise((resolve) => setTimeout(resolve, 1500))
      } while (blockNumberData[0] < blockNumberData[1])
      
      this.plottingData.status = lang.startingFarmer
      // After local node is fully Synced, the farmer will be able to actualy plot and farm. 
      const { publicKey, mnemonic } = await startFarming(this.plotDirectory)
 
      if (publicKey && mnemonic) {
        await this.client.init(publicKey, mnemonic)
      }
      this.plottingData.status = lang.fetchingPlot;      
      // Query from last block until find last RootBlockStored, then return last segmentIndex on the public network.
      const networkSegmentIndex = await this.client.getNetworkSegmentIndex()
      let localSegmentIndex = 1;
      // TODO: Fix this timer, not updating correctly
      timer = window.setInterval(() => (this.elapsedms += 100), 100)
      this.plotting = false
     
      // If the network is new and have no blocks. The plot and farm will take no time. This check is usefull for local development.
      if (networkSegmentIndex === 1) {
        this.plottingData.finishedGB = 10
        this.plottingData.status = lang.initSegments
      } else {
        // Otherwise, if network have blocks, validate and show plotting progress and archived segments.
        do {
          // At this point the farmer is already running and also plotting.
          // Block subs are ON and we are validating and storing farmed blocks.
          localSegmentIndex = await getLocalFarmerSegmentIndex()
          this.plottingData.finishedGB = (localSegmentIndex * 10) / networkSegmentIndex
          this.plottingData.status = "Archived " + localSegmentIndex + " of " + networkSegmentIndex + " Segments"
          await new Promise((resolve) => setTimeout(resolve, 2000))
          // But we wait to get fully plotted. Afgter this the user can click next and go to dashboard.
        } while (localSegmentIndex < networkSegmentIndex)
      }
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
