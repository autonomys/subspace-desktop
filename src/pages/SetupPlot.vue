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
            input-class="setupPlotInput"
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
                input-class="setupPlotInput"
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
                input-class="setupPlotInput"
                outlined
                readonly
                suffix="GB"
                v-model="stats.freeGB"
              )
                q-tooltip.q-pa-sm
                  p {{ lang.availableSpace }}
              .q-mt-sm {{ lang.allocated }}
                q-spinner-orbit(
                  style="margin-left: 6px"
                  color="black"
                  size="12px"
                  v-if="blockchainSizeGB === 0"
                )
              q-input(
                bg-color="blue-2"
                dense
                input-class="setupPlotInput"
                outlined
                suffix="GB"
                v-model="allocatedGB"
                v-if="blockchainSizeGB > 0"
              )
                q-tooltip.q-pa-sm
                  p {{ lang.allocatedSpace }}
              q-input(
                color="blue"
                dense
                input-class="setupPlotInput"
                outlined
                readonly
                prefix="Estimating blockchain size ..."
                v-if="blockchainSizeGB === 0"
              )
                q-tooltip.q-pa-sm
                  p {{ lang.estimatingSpace }}

        .col.q-pr-md
          .row.justify-center(
            style="transform: scale(-1, 1)"
            v-if="blockchainSizeGB > 0"
          )
            apexchart(
              :options="chartOptions"
              :series="chartData"
              type="donut"
              width="200px"
            )
          .row.justify-center(v-else)
            q-spinner-pie(color="grey" size="120px" thickness="1")
          .row.q-mt-md
            .col-1
            .col
              q-slider(
                :max="this.stats.safeAvailableGB"
                :min="1"
                :step="5"
                color="blue"
                snap
                style="height: 25px"
                v-model="allocatedGB"
                v-if="blockchainSizeGB > 0"
              )
            .col-1
  .row.justify-end.q-mt-sm.absolute-bottom.q-pb-md
    .col-auto.q-pr-md
      div {{ lang.hint }}
    .col.q-pr-md
      div {{ lang.hint2 }}
    .col-expand
    .col-auto
      q-btn(
        :disable="!canContinue"
        @click="confirmCreateDir()"
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
import { defineComponent } from "vue"
import { debounce } from "quasar"
import * as path from "@tauri-apps/api/path"
import * as fs from "@tauri-apps/api/fs"
import * as util from "../lib/util"
import { chartOptions, ChartDataType, StatsType } from "../lib/types"
import * as native from "../lib/native"
import { globalState as global } from "../lib/global"
import { appConfig } from "../lib/appConfig"
import { appData, appDataDialog } from "../lib/appData"
import mnemonicModal from "../components/mnemonicModal.vue"

const tauri = { path, fs }
const lang = global.data.loc.text.setupPlot

export default defineComponent({
  data() {
    return {
      revealKey: false,
      plotDirectory: "/",
      allocatedGB: 1,
      blockchainSizeGB: 0,
      validPath: true,
      defaultPath: "/",
      driveStats: <native.DriveStats>{ freeBytes: 0, totalBytes: 0 },
      lang,
      chartOptions,
      rewardAddress: ""
    }
  },
  computed: {
    chartData(): ChartDataType {
      return [
        this.stats.utilizedGB,
        this.stats.freeGB,
        this.allocatedGB < 5 ? 5 : this.allocatedGB
      ]
    },
    stats(): StatsType {
      const totalDiskSizeGB = util.toFixed(this.driveStats.totalBytes / 1e9, 2)
      // node will occupy AT MOST 10GB (safe margin), so deduct 10GB from safe space
      const safeAvailableGB = this.driveStats.freeBytes / 1e9 - 10
      const utilizedGB = util.toFixed(totalDiskSizeGB - safeAvailableGB, 2)
      const freeGB = ((): number => {
        const val = util.toFixed(safeAvailableGB - this.allocatedGB, 2)
        if (val >= 0) {
          return val
        } else {
          return 0
        }
      })()

      return {
        totalDiskSizeGB,
        safeAvailableGB,
        utilizedGB,
        freeGB
      }
    },
    canContinue(): boolean {
      return this.blockchainSizeGB > 0 && this.validPath
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
    await this.updateDriveStats()
    this.defaultPath = (await tauri.path.dataDir()) + util.appName
    this.plotDirectory = this.defaultPath
    do {
      this.blockchainSizeGB = (await appConfig.read()).segmentCache.blockchainSizeGB || 0
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } while (this.blockchainSizeGB <= 0)
  },
  async created() {
    this.$watch(
      "plotDirectory",
      debounce((val): null => {
        if (val.length === 0) {
          this.validPath = false
        } else {
          if (this.plotDirectory == this.defaultPath) {
            this.validPath = true
          } else {
            // TODO: check if path is valid on any OS
            this.validPath = true
          }
        }
        return null
      }, 500)
    )
  },
  methods: {
    async confirmCreateDir() {
      const dirExists = await native.dirExists(this.plotDirectory)

      if (dirExists) {
        util.infoLogger("SETUP PLOT | found the old plotting directory")
        const files = await tauri.fs
          .readDir(this.plotDirectory)
          .catch((error) => {
            util.errorLogger(error)
          })

        if (files) {
          console.log("FILES ARE: :", files)
          if (files.length === 0 || (files.length === 1 && files.some(item => item.name === "subspace-desktop.cfg"))){
            appDataDialog.existingDirectoryConfirm(
              this.plotDirectory,
              this.prepareForPlotting
            )
          // we are in FIRST TIME START, meaning there is are no existing plot
          // if there are some files in this folder, it's weird
          } else {
            appDataDialog.notEmptyDirectoryInfo(this.plotDirectory)
          }
        }
      } else if (!dirExists) {
        appDataDialog.newDirectoryConfirm(
          this.plotDirectory,
          this.prepareForPlotting
        )
      }
    },
    async prepareForPlotting() {
      if (this.plotDirectory.charAt(this.plotDirectory.length - 1) == "/")
        this.plotDirectory.slice(-1)
      await appData.createCustomDataDir(this.plotDirectory)
      util.infoLogger("SETUP PLOT | custom directory created")
      await this.checkIdentity()
    },
    async updateDriveStats() {
      const stats = await native.driveStats(this.plotDirectory)
      console.log("Drive Stats:", stats)
      this.driveStats = stats
    },
    async selectDir() {
      const result = await native
        .selectDir(this.plotDirectory)
        .catch((error: unknown) => {
          util.errorLogger(error)
        })
      if (result) this.plotDirectory = result
    },
    async checkIdentity() {
      const config = await appConfig.read()
      if (config.rewardAddress === "") {
        util.infoLogger("SETUP PLOT | reward address was empty, creating a new one")
        this.rewardAddress = this.$client.createRewardAddress()
        await this.viewMnemonic()
      }
      else {
        util.infoLogger("SETUP PLOT | reward address was initialized before, proceeding to plotting")
        await appConfig.update({
          plot: { location: this.plotDirectory, sizeGB: this.allocatedGB },
        })
        this.$router.replace({ name: "plottingProgress" })
      }
    },
    async viewMnemonic() {
      const modal = await util.showModal(mnemonicModal)
      modal?.onDismiss(async () => {
        await appConfig.update({
          plot: { location: this.plotDirectory, sizeGB: this.allocatedGB },
          rewardAddress: this.rewardAddress
        })
        this.$router.replace({ name: "plottingProgress" })
      })
    }
  }
})
</script>

<style lang="sass">
.setupPlotInput
  font-size: 20px
  padding-top: 5px
  margin-top: 0px
</style>
