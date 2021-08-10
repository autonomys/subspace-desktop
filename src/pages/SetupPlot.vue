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
          div Plots Directory {{ validPath }}
          q-input.q-field--highlighted(:error="!validPath" color="blue" dense input-class="pkdisplay" outlined v-model="plotDirectory")
            template(v-slot:after)
              q-btn.shadow-0(@click="selectDir()" color="blue" flat icon="folder" size="lg")
        //- .col(style="padding-top: 18px")
          //- q-btn(color="blue" flat icon="folder" size="md" style="height: 45px")
      .row.items-center.q-gutter-md.q-pt-sm
        .col-4
          .row
            .col.q-pr-md
              .q-mt-sm Used
              q-input(dense input-class="pkdisplay" outlined readonly suffix="GB" v-model="utilizedGB")
              .q-mt-sm Free
              q-input(:error="unsafeFree" dense hide-bottom-space input-class="pkdisplay" outlined readonly suffix="GB" v-model="freeGB")
                q-tooltip
                  p We suggest you retain at least 20 GB of free available space on this drive.
              .q-mt-sm Allocated for Plot
              q-input.q-field--highlighted(color="blue" dense input-class="pkdisplay" outlined suffix="GB" type="number" v-model="allocatedGB")
        .col.q-pr-md
          .row.justify-center
            apexchart(:options="chartOptions" :series="chartData" type="donut" width="200px")
            //- q-circular-progress.absolute-center(:thickness="0" :value="0" center-color="grey-4" size="120px")
            //- q-circular-progress.absolute-center(:angle="diskPercentUsed * 3" :thickness="0.5" :value="allocatedGBChart" center-color="grey-3" color="blue" size="120px")
            //- q-circular-progress.absolute-center(:thickness="0.5" :value="diskPercentUsed" center-color="grey-3" color="grey-9" size="120px")
          .row.q-mt-lg
            .col-1
            .col
              q-slider(:max="safeAvailableGB" :min="0" :step="1" color="blue" markers snap style="height: 25px" v-model="allocatedGB")
            .col-1
  .row.justify-end.q-mt-lg.absolute-bottom.q-pb-lg
    .col-auto.q-ml-xl.q-pr-md
      div Hint:
    .col.q-pr-md
      //- small Hint:
      div Increasing your plots size will improve Farmer profitability.
      //- div(style="height: 10px")
    .col-auto.q-pr-md
      div Initial plotting time:
      div(style="font-size: 20px") {{ printEstimatedTime }}
    .col-expand
    .col-auto
      q-btn(:disable="!canContinue" @click="$router.replace({ name: 'plottingProgress' })" color="blue-8" icon-right="downloading" label="Start Plotting" outline size="lg")
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
import * as dialog from "@tauri-apps/api/dialog"
import * as fs from "@tauri-apps/api/fs"
import * as path from "@tauri-apps/api/path"
const tauri = { dialog, fs, path }
import { defineComponent } from "vue"
import { native, DriveStats } from "src/lib/util"
import { debounce } from "quasar"
import TimeAgo from "javascript-time-ago"
import en from "javascript-time-ago/locale/en"
import * as global from "src/lib/global"
const lang = global.data.loc.text.setupPlot
TimeAgo.addDefaultLocale(en)
const timeAgo = new TimeAgo("en-US")
import { ApexOptions } from "apexcharts"
const chartOptions: ApexOptions = {
  chart: { height: "100px" },
  legend: { show: false },
  colors: ["#E2E2E2", "#2081F0"],
  plotOptions: { pie: { startAngle: 0, endAngle: 360, donut: { size: "70px" } } },
  dataLabels: { enabled: false },
  labels: [],
  markers: { hover: { size: 0 } },
  tooltip: { enabled: false },
}

export default defineComponent({
  data() {
    let userConfirm: boolean = false
    let generatedPk = "98da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8f"
    let revealKey = false
    let allocatedGB = 1
    let plotDirectory = "/Subspace/plots"
    let defaultPath = ""
    let driveStats: DriveStats = { freeBytes: 0, totalBytes: 0 }
    return { chartOptions, revealKey, userConfirm, lang, generatedPk, plotDirectory, allocatedGB, validPath: true, defaultPath, driveStats }
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
      debounce(async (val) => {
        console.log(val)
        if (this.plotDirectory == this.defaultPath) return (this.validPath = true)
        this.validPath = await native.dirExists(val)
        if (this.validPath) await this.updateDriveStats()
      }, 500)
    )
  },
  computed: {
    chartData(): any {
      return [this.utilizedGB, this.allocatedGB]
    },
    printEstimatedTime(): string {
      return timeAgo.format(Date.now() + this.plotTimeHr * 1000000, "long").split("in")[1]
    },
    plotTimeHr(): number {
      return this.allocatedGB * 0.1
    },
    totalDiskSizeGB(): number {
      return parseFloat((this.driveStats.totalBytes / 1e9).toFixed(2))
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
      return this.driveStats.freeBytes / 1e9
    },
    utilizedGB(): number {
      return parseFloat((this.totalDiskSizeGB - this.safeAvailableGB).toFixed(2))
    },
    freeGB(): number {
      return parseFloat((this.safeAvailableGB - this.allocatedGB).toFixed(2))
    },
    canContinue(): boolean {
      return this.allocatedGB >= 1
    },
    unsafeFree(): boolean {
      return this.freeGB < 20
    },
  },
  methods: {
    async updateDriveStats() {
      const stats = await native.driveStats(this.plotDirectory)
      console.log("Drive Stats:", stats)
      this.driveStats = stats
    },
    async selectDir() {
      const result = await native.selectDir(this.plotDirectory).catch(console.error)
      if (result) this.plotDirectory = result
    },
  },
  watch: {
    allocatedGB(val) {
      if (val > this.safeAvailableGB) {
        this.$nextTick(() => {
          this.allocatedGB = parseFloat(this.safeAvailableGB.toFixed(0))
        })
      }
    },
  },
})
</script>
