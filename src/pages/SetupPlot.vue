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
              .q-mt-sm Utilized
              q-input(dense input-class="pkdisplay" outlined readonly suffix="GB" v-model="utilizedGB")
              .q-mt-sm Free
              q-input(dense input-class="pkdisplay" outlined readonly suffix="GB" v-model="freeGB")
              .q-mt-sm Allocated for Plots
              q-input.q-field--highlighted(color="blue" dense input-class="pkdisplay" outlined suffix="GB" type="number" v-model="allocatedGB")
        .col.q-pr-md
          .row.justify-center
            .relative-position(style="height: 145px; width: 170px")
              q-circular-progress.absolute-center(:thickness="0" :value="0" center-color="grey-4" size="120px")
              q-circular-progress.absolute-center(:angle="diskPercentUsed * 3" :thickness="0.5" :value="allocatedGBChart" center-color="grey-3" color="blue" size="120px")
              q-circular-progress.absolute-center(:thickness="0.5" :value="diskPercentUsed" center-color="grey-3" color="grey-9" size="120px")
          .row.q-mt-lg
            .col-1
            .col
              q-slider(:max="safeAvailableGB" :min="0" :step="100" color="blue" markers snap style="height: 25px" v-model="allocatedGB")
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
import { native } from "src/lib/util"
import { debounce } from "quasar"
import TimeAgo from "javascript-time-ago"
import en from "javascript-time-ago/locale/en"
import * as global from "src/lib/global"
const lang = global.data.loc.text.setupPlot
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
    let defaultPath = ""
    return { revealKey, userConfirm, lang, generatedPk, plotDirectory, allocatedGB, validPath: true, defaultPath }
  },
  async mounted() {
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
      }, 500)
    )
  },
  computed: {
    printEstimatedTime(): string {
      return timeAgo.format(Date.now() + this.plotTimeHr * 1000000, "long").split("in")[1]
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
    async selectDir() {
      const result = await native.selectDir(this.plotDirectory).catch(console.error)
      if (result) this.plotDirectory = result
    },
  },
  watch: {
    // async plotDirectory(val) {
    //   console.log(val)
    //   this.validPath = await native.dirExists(val)
    // },
  },
})
</script>
