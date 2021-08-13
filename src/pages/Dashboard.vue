<template lang="pug">
q-page.q-pl-xl.q-pr-xl.q-pt-md
  .row.justify-center
  .row.q-pb-sm.justify-center
  .row.q-gutter-md.q-pb-md(v-if="!expanded")
    .col
      q-card(bordered flat)
        .q-pa-sm
          .row.items-center
            q-icon.q-mr-sm(color="grey" name="downloading" size="40px")
            h6.text-weight-light Plot
          q-separator.q-mt-xs
          .row.items-center.q-mt-sm
            .col-auto.q-mr-md(v-if="plot.state == 'finished'")
              q-icon(color="green" name="done" size="40px")
            .col-auto.q-mr-md(v-if="plot.state == 'verifying'")
              q-spinner-box(color="grey" size="40px")
            .col-auto.q-mr-md(v-if="plot.state == 'starting'")
              q-spinner-orbit(color="grey" size="40px")
            .col
              .text-weight-light Status:
              p {{ plot.message }}
          .row.items-center.q-mt-sm
            .col-auto.q-mr-md
              q-icon(color="black" name="storage" size="40px")
            .col
              .text-weight-light Allocated:
              p {{ util.toFixed(config?.plot?.sizeGB, 2) }} GB
    .col
      q-card(bordered flat)
        .q-pa-sm
          .row.items-center
            q-icon.q-mr-sm(color="grey" name="settings_ethernet" size="40px")
            h6.text-weight-light Network
          q-separator.q-mt-xs
          .row.items-center.q-mt-sm
            .col-auto.q-mr-md(v-if="network.state == 'finished'")
              q-icon(color="green" name="done" size="40px")
            .col-auto.q-mr-md(v-if="network.state == 'findingPeers'")
              q-spinner-radio(color="grey" name="done" size="40px")
            .col-auto.q-mr-md(v-if="network.state == 'starting'")
              q-spinner-orbit(color="grey" name="done" size="40px")
            .col
              .text-weight-light Status:
              p {{ network.message }}
          .row.items-center.q-mt-sm
            .col
              .row.items-center
                .col-auto.q-mr-md
                  q-icon(color="black" name="group" size="40px")
                .col
                  .text-weight-light Peers:
                  p {{ network.peers }}
          //-   .col
          //-     .row.items-center
          //-       .col-auto.q-mr-md
          //-         q-icon(color="black" name="south" size="40px")
          //-       .col
          //-         .text-weight-light Downloaded:
          //-         p 3600 GB
  .row.q-gutter-md
    .col
      q-card(bordered flat)
        .q-pa-sm
          .row.items-center
            .col-auto.q-mr-sm
              .row.items-center
                q-icon.q-mr-sm(color="grey" name="grid_view" size="40px")
                .text-h6.text-weight-light Farmed Blocks:
            .col-auto.q-mr-md
              //- .text-weight-light Blocks Farmed
              h6 {{ minedBlocks.length }}
            .col-auto.q-mr-md
              .text-weight-light Total Earned
              p {{ minedTotalEarned }} SSC
            q-space
            .col.col-auto
              //- .row
              .row.justify-center
                q-btn(@click="expanded = true" color="grey-10" flat icon-right="list" size="md" stretch v-if="!expanded")
                q-btn(@click="expanded = false" color="grey-10" flat icon-right="south" size="md" stretch v-else)

        q-separator
        .row.q-gutter-sm.q-pa-md
          .col-2 Block Number
          .col-4 Time
          .col-2 # Transactions
          .col-3 Block Reward + Fees
        q-scroll-area(:style="blocksListStyle")
          transition-group(appear enter-active-class="animated slideInTop " name="list")
            div.bg-white(:key="block.time" v-for="block of minedBlocks")
              q-separator
              .row.q-gutter-sm.q-pa-xs.q-ml-sm
                .col-2
                  p {{ block.blockNum }}
                .col-auto
                  q-separator(vertical)
                .col-4
                  p {{ new Date(block.time).toLocaleString() }}
                .col-2
                  p {{ block.transactions }}
                .col-2
                  p {{ block.blockReward }} SSC
                .col-expand
                .col
                  .row.justify-end
                    .col-auto
                      q-btn(color="grey" flat icon="info" size="sm")
</template>

<script lang="ts">
import { defineComponent } from "vue"
import { QInput, Dialog, Notify } from "quasar"
import * as global from "src/lib/global"
import * as util from "src/lib/util"
import { clear } from "console"
const lang = global.data.loc.text.dashboard
type StateString = "starting" | "verifyingPlot" | "allocatingPeers"
let mineBlocksInterval
interface MinedBlock {
  blockNum: number
  time: number
  transactions: number
  blockReward: number
}
export default defineComponent({
  data() {
    let config: util.ConfigFile = {}
    let globalState = {
      state: "starting",
      message: "Initializing...",
    }
    let network = {
      state: "starting",
      message: "Initializing...",
      peers: 0,
    }
    let plot = {
      state: "starting",
      message: "Initializing...",
    }
    let minedBlocks: MinedBlock[] = []
    return { lang, config, network, plot, global: global.data, globalState, expanded: false, minedBlocks, util }
  },
  async mounted() {
    const config = await util.config.read()
    const valid = util.config.validate(config)
    this.global.status.state = "loading"
    this.global.status.message = "loading..."
    if (!valid) {
      return Dialog.create({
        message: "Config file is corrupted, resetting farmer...",
        noEscDismiss: true,
        noBackdropDismiss: true,
        noRouteDismiss: true,
      }).onOk(async () => {
        await util.config.clear()
        this.$router.replace({ name: "index" })
      })
    }
    await this.readConfig()
    this.fakeStart()
  },
  computed: {
    blocksListStyle(): any {
      return this.expanded ? { height: "370px" } : { height: "185px" }
    },
    minedTotalEarned(): number {
      return this.minedBlocks.reduce((agg, val) => {
        return val.blockReward + agg
      }, 0)
    },
  },
  unmounted() {
    if (mineBlocksInterval) clearInterval(mineBlocksInterval)
  },
  methods: {
    async readConfig() {
      this.config = await util.config.read()
    },
    async fakeStart() {
      // setTimeout(() => {
      //   // this.plot.state = "verifying"
      //   // this.plot.message = "verifying plot data..."
      //   this.global.status.state = "live"
      // }, util.random(10000, 20000))

      setTimeout(() => {
        setTimeout(() => {
          this.network.peers += util.random(1, 3)
        }, util.random(500, 1000))
        setTimeout(() => {
          this.network.peers += util.random(1, 3)
        }, util.random(2000, 6000))
        setTimeout(() => {
          this.network.peers += util.random(1, 3)
        }, util.random(5000, 9000))
        setTimeout(() => {
          this.network.peers += util.random(1, 3)
        }, util.random(6000, 10000))
        setTimeout(() => {
          this.network.peers += util.random(1, 3)
        }, util.random(9000, 200000))
        setTimeout(() => {
          this.network.peers += util.random(1, 3)
        }, util.random(500, 1000))
      }, util.random(500, 2000))
      setTimeout(() => {
        this.plot.state = "verifying"
        this.plot.message = "Verifying plot data..."
        setTimeout(() => {
          this.plot.state = "finished"
          this.plot.message = "Plot active"
          if (this.network.state == "finished") {
            this.global.status.state = "live"
            this.global.status.message = "synced and farming"
          }
        }, util.random(5000, 13000))
      }, util.random(1000, 3000))
      setTimeout(() => {
        this.network.state = "findingPeers"
        this.network.message = "Searching for peers..."
        setTimeout(() => {
          this.network.state = "finished"
          this.network.message = "Synced and connected"
          if (this.plot.state == "finished") {
            this.global.status.state = "live"
            this.global.status.message = "synced and farming"
          }
          mineBlocksInterval = setInterval(() => {
            const mine = util.random(1, 100)
            if (mine > 30) {
              setTimeout(() => {
                this.mineBlock()
              }, util.random(2000, 8000))
            }
          }, 5000)
        }, util.random(3000, 6000))
      }, util.random(1000, 3000))
    },
    mineBlock() {
      const minedBlock: MinedBlock = {
        blockNum: util.toFixed(Date.now() / 1000 + util.random(5, 10), 0),
        time: Date.now(),
        transactions: util.random(5, 1000),
        blockReward: util.random(1, 140),
      }
      this.minedBlocks.unshift(minedBlock)
      Notify.create({
        color: "green",
        progress: true,
        message: `Farmed Block: ${minedBlock.blockNum} Reward: ${minedBlock.blockReward} SSC`,
        position: "bottom-right",
      })
    },
  },
  watch: {},
})
</script>

<style lang="sass">
.list-move
  transition: transform 0.5s
</style>