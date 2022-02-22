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
          q-input.q-field--highlighted(
            :error="!validPath"
            :error-message="lang.invalidDir"
            color="blue"
            dense
            input-class="pkdisplay"
            outlined
            v-model="plotDirectory"
          )
            template(v-slot:after)
              q-btn.shadow-0(
                @click="selectDir()"
                color="blue"
                flat
                icon="folder"
                size="lg"
              )
      .row.items-center.q-gutter-md
        .col-4
          .row
            .col.q-pr-md
              .q-mt-sm {{ lang.utilized }}
              q-input.bg-grey-3(
                dense
                input-class="pkdisplay"
                outlined
                readonly
                suffix="GB"
                v-model="stats.utilizedGB"
              )
                q-tooltip.q-pa-sm
                  p {{ lang.utilizedSpace }}
              .q-mt-sm {{ lang.available }}
              q-input(
                :error="unsafeFree"
                dense
                hide-bottom-space
                input-class="pkdisplay"
                outlined
                readonly
                suffix="GB"
                v-model="stats.freeGB"
              )
                q-tooltip.q-pa-sm
                  p {{ lang.availableSpace }}
              .q-mt-sm {{ lang.allocated }}
              q-input(
                color="blue"
                dense
                input-class="pkdisplay"
                outlined
                readonly
                suffix="GB"
                v-model="allocatedGB"
              )
                q-tooltip.q-pa-sm
                  p {{ lang.allocatedSpace }}
        .col.q-pr-md
          .row.justify-center(style="transform: scale(-1, 1)")
            apexchart(
              :options="chartOptions"
              :series="chartData"
              type="donut"
              width="200px"
            )
  .row.justify-end.q-mt-sm.absolute-bottom.q-pb-md
    .col-auto.q-pr-md
      div {{ lang.hint }}
    .col.q-pr-md
      div {{ lang.hint2 }}
    .col-auto.q-pr-md
      div {{ lang.initial }}
      div(style="font-size: 20px") {{ printEstimatedTime }}
    .col-expand
    .col-auto
      q-btn(
        :disable="!canContinue"
        @click="startPlotting()"
        color="blue-8"
        icon-right="downloading"
        label="Start Plotting"
        outline
        size="lg"
      )
      q-tooltip.q-pa-md(v-if="!canContinue")
        p.q-mb-lg {{ lang.tooltip }}
</template>



<script lang="ts">
import * as path from "@tauri-apps/api/path"
const tauri = { path }
import { defineComponent } from "vue"
import * as util from "src/lib/util"
import * as native from "src/lib/native"
import { debounce } from "quasar"
import { globalState as global } from "src/lib/global"
const lang = global.data.loc.text.setupPlot

import TimeAgo from "javascript-time-ago"
import en from "javascript-time-ago/locale/en"
TimeAgo.addDefaultLocale(en)
const timeAgo = new TimeAgo("en-US")

interface StatsType {
  totalDiskSizeGB: number
  safeAvailableGB: number
  utilizedGB: number
  freeGB: number
}
type ChartDataType = number[]
import { ApexOptions } from "apexcharts"
const chartOptions: ApexOptions = {
  legend: { show: false },
  colors: ["#E0E0E0", "#FFFFFF", "#2081F0"],
  plotOptions: {
    pie: {
      startAngle: 0,
      endAngle: 360,
      expandOnClick: false,
      donut: { size: "40px" }
    }
  },
  dataLabels: { enabled: false },
  labels: [],
  states: {
    active: { filter: { type: "none" } },
    hover: { filter: { type: "none" } }
  },
  markers: { hover: { size: 0 } },
  tooltip: { enabled: false }
}

export default defineComponent({
  data() {
    return {
      revealKey: false,
      userConfirm: false,
      plotDirectory: "/Subspace/plots",
      allocatedGB: 10,
      validPath: true,
      defaultPath: "/",
      driveStats: <native.DriveStats>{ freeBytes: 0, totalBytes: 0 },
      lang,
      chartOptions,
      client: global.client,
    }
  },
  computed: {
    chartData(): ChartDataType {
      return [this.stats.utilizedGB, this.stats.freeGB, this.allocatedGB]
    },
    printEstimatedTime(): string {
      return timeAgo.format(Date.now() + this.plotTimeHr).split("in")[1]
    },
    plotTimeHr(): number {
      return util.plotTimeMsEstimate(this.allocatedGB)
    },
    stats(): StatsType {
      const totalDiskSizeGB = util.toFixed(this.driveStats.totalBytes / 1e9, 2)
      const safeAvailableGB = this.driveStats.freeBytes / 1e9
      const utilizedGB = util.toFixed(totalDiskSizeGB - safeAvailableGB, 2)
      const freeGB = ((): number => {
        const val = util.toFixed(safeAvailableGB - this.allocatedGB, 2)
        if (val >= 0) return val
        else return 0
      })()

      return {
        totalDiskSizeGB,
        safeAvailableGB,
        utilizedGB,
        freeGB
      }
    },
    canContinue(): boolean {
      return this.allocatedGB >= 1 && this.validPath
    },
    unsafeFree(): boolean {
      return this.stats.freeGB < 20
    }
  },
  watch: {
    "stats.freeGB"(val) {
      if (val < 0) {
        this.$nextTick(() => {
          this.stats.freeGB = 0
          console.log(this.stats.freeGB)
        })
      }
    },
    allocatedGB(val) {
      if (!this.stats?.safeAvailableGB) return
      if (val > this.stats?.safeAvailableGB) {
        this.$nextTick(() => {
          this.allocatedGB = parseFloat(this.stats?.safeAvailableGB.toFixed(0))
        })
      } else {
        this.$nextTick(() => {
          this.allocatedGB = util.toFixed(this.allocatedGB, 2)
        })
      }
    }
  },
  async mounted() {
    const homeDir = await tauri.path.homeDir()
    this.plotDirectory = homeDir
    this.updateDriveStats()
    this.defaultPath = (await tauri.path.homeDir()) + ".subspace-farmer-demo"
    this.plotDirectory = this.defaultPath
  },
  async created() {
    this.$watch(
      "plotDirectory",
      debounce(async (val): Promise<null> => {
        //console.log(val)
        if (this.plotDirectory == this.defaultPath) {
          this.validPath = true
          return null
        }
        this.validPath = await native.dirExists(val)
        if (this.validPath) await this.updateDriveStats()
        return null
      }, 500)
    )
  },
  methods: {
    async startPlotting() {
      if (this.plotDirectory.charAt(this.plotDirectory.length - 1) == "/")
        this.plotDirectory.slice(-1)
      await util.config.update({
        plot: {
          sizeGB: this.allocatedGB,
          location: this.plotDirectory 
        }
      })
      if (this.defaultPath != this.plotDirectory)
        await native.createDir(this.plotDirectory)
      this.$router.replace({ name: "plottingProgress" })
    },
    async updateDriveStats() {
      const stats = await native.driveStats(this.plotDirectory)
      console.log("Drive Stats:", stats)
      this.driveStats = stats
    },
    async selectDir() {
      const result = await native
        .selectDir(this.plotDirectory)
        .catch(console.error)
      if (result) this.plotDirectory = result
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
