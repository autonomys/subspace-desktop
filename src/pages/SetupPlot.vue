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
                color="blue"
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
                :max="getMaxPlotSize()"
                :min="1"
                :step="1"
                color="blue"
                markers
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
import * as path from "@tauri-apps/api/path"
import { defineComponent } from "vue"
import * as util from "src/lib/util"
import { chartOptions, ChartDataType, StatsType } from "src/lib/types"
import * as native from "src/lib/native"
import { debounce } from "quasar"
import { globalState as global } from "src/lib/global"
import * as fs from "@tauri-apps/api/fs"
import { appConfig } from "src/lib/appConfig"
import { appData, appDataDialog } from "src/lib/appData"
import mnemonicModal from "components/mnemonicModal.vue"

const tauri = { path, fs }
const lang = global.data.loc.text.setupPlot

export default defineComponent({
  data() {
    return {
      revealKey: false,
      userConfirm: false,
      plotDirectory: "/",
      allocatedGB: 1,
      blockchainSizeGB: 0,
      validPath: true,
      defaultPath: "/",
      driveStats: <native.DriveStats>{ freeBytes: 0, totalBytes: 0 },
      lang,
      chartOptions,
      client: global.client
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
    this.defaultPath = (await tauri.path.dataDir()) + util.dirName
    this.plotDirectory = this.defaultPath
    do {
      this.blockchainSizeGB = appConfig.getAppConfig()?.segmentCache.blockchainSizeGB || 0
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
    getMaxPlotSize() {
      return Math.min(this.stats.safeAvailableGB, this.blockchainSizeGB, 100)
    },
    async confirmCreateDir() {
      const dirExists = await native.dirExists(this.plotDirectory)

      if (dirExists) {
        const files = await tauri.fs
          .readDir(this.plotDirectory)
          .catch(console.error)

        if (files) {
          console.log("FILES ARE: :", files)
          if (files.length === 0 || !files.some(item=> item.name === "chains" )) {
            appDataDialog.existingDirectoryConfirm(
              this.plotDirectory,
              this.prepareForPlotting
            )
          } else if (files.length > 0) {
            appDataDialog.emptyDirectoryInfo(this.plotDirectory)
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
      appConfig.updateAppConfig({ location: this.plotDirectory, sizeGB: this.allocatedGB }, null, null, null, null, null)

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
        .catch(console.error)
      if (result) this.plotDirectory = result
    },
    async checkIdentity() {
      const config = appConfig.getAppConfig()
      if (config && config.importedRewAddr === false) {
        await this.client.createIdentity(this.plotDirectory)
        await this.viewMnemonic()
      }
    },
    async viewMnemonic() {
      const modal = await util.showModal(mnemonicModal)
      modal?.onDismiss(() => {
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
