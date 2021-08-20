<template lang="pug">
q-page.q-pl-xl.q-pr-xl.q-pt-md
  .row.justify-center
  .row.q-pb-sm.justify-center
  .row.q-gutter-md.q-pb-md(v-if="!expanded")
    .col
      plotCard(:config="config" :plot="plot")
    .col
      netCard(:config="config" :network="network")
  .row.q-gutter-md
    .col
      farmedList(:expanded="expanded" :minedBlocksList="minedBlocksList" :minedTotalEarned="minedTotalEarned" @expand="expand")
</template>

<script lang="ts">
import { defineComponent } from "vue"
import { Dialog, Notify } from "quasar"
import * as global from "src/lib/global"
import * as util from "src/lib/util"
import farmedList from "components/farmedList.vue"
import netCard from "components/netCard.vue"
import plotCard from "components/plotCard.vue"
import { MinedBlock } from "src/lib/types"
const lang = global.data.loc.text.dashboard
let mineBlocksInterval
export default defineComponent({
  components: { farmedList, netCard, plotCard },
  data() {
    let config: util.ConfigFile = {}
    let globalState = {
      state: "starting",
      message: lang.initializing,
    }
    let network = {
      state: "starting",
      message: lang.initializing,
      peers: 0,
    }
    let plot = {
      state: "starting",
      message: lang.initializing,
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
        message: lang.corrupt,
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
    minedBlocksList(): any {
      return this.minedBlocks
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
    expand(val: boolean) {
      this.expanded = val
    },
    async readConfig() {
      this.config = await util.config.read()
    },
    async fakeStart() {
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
        this.plot.message = lang.verifyingPlot
        setTimeout(() => {
          this.plot.state = "finished"
          this.plot.message = lang.plotActive
          if (this.network.state == "finished") {
            this.global.status.state = "live"
            this.global.status.message = lang.syncedMsg
          }
        }, util.random(5000, 13000))
      }, util.random(1000, 3000))
      setTimeout(() => {
        this.network.state = "findingPeers"
        this.network.message = lang.searchPeers
        setTimeout(() => {
          this.network.state = "finished"
          this.network.message = lang.synced
          if (this.plot.state == "finished") {
            this.global.status.state = "live"
            this.global.status.message = lang.farming
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
        message: `${lang.farmedBlock}: ${minedBlock.blockNum} ${lang.reward} ${minedBlock.blockReward} SSC`,
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