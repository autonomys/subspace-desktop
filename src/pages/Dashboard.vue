<template lang="pug">
q-page.q-pl-xl.q-pr-xl.q-pt-md
  .row.justify-center
  .row.q-pb-sm.justify-center
  div(v-if="!loading")
    .row.q-gutter-md.q-pb-md(v-if="!expanded")
      .col
        plotCard(:config="config" :plot="plot")
      .col
        netCard(:config="config" :network="network")
    .row.q-gutter-md
      .col
        farmedList(:expanded="expanded" :minedBlocksList="minedBlocksList" :minedTotalEarned="minedTotalEarned" @expand="expand")
  div(v-else)
    .flex
      .absolute-center
        .row.justify-center
          q-spinner-orbit(color="grey" size="120px")
        h4 Connecting to client...
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
import { ClientType, Client } from "src/lib/client"
import { ApiPromise } from "@polkadot/api"
import { Header } from "@polkadot/types/interfaces/runtime"
import { VoidFn } from "@polkadot/api/types"
const lang = global.data.loc.text.dashboard
let api: ApiPromise
let mineBlocksInterval
let clientInterval
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
    let unsubscribe: VoidFn = () => {}
    return { lang, config, network, plot, global: global.data, globalState, expanded: false, minedBlocks, util, loading: true, unsubscribe }
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
    this.unsubscribe()
  },
  created() {
    this.$watch(
      "global.client",
      (val) => {
        console.log("api rdy")
        if (val) {
          this.loading = false
          api = val.api
          this.testClient()
        } else this.loading = true
      },
      { immediate: true }
    )
  },
  methods: {
    async testClient() {
      if (!api) return
      const ready = await api.isConnected
      console.log("api:", ready)
      const state = await api.query.system.number
      console.log("state:", state)
      const time = await api.query.timestamp.now()
      console.log("time:", time.toHuman())
      const chain = await api.rpc.system.chain()
      const lastHeader = await api.rpc.chain.getHeader()

      const peers = await api.rpc.net.peerCount
      console.log("Peers", peers) // this is undefined?
      this.unsubscribe()
      this.unsubscribe = await api.rpc.chain.subscribeNewHeads((lastHeader) => {
        const type = typeof lastHeader
        console.log(`${chain}: last block #${lastHeader.number} has hash ${lastHeader.hash}`)
        this.mineBlock(lastHeader)
      })
    },

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
          // mineBlocksInterval = setInterval(() => {
          //   const mine = util.random(1, 100)
          //   if (mine > 30) {
          //     setTimeout(() => {
          //       this.mineBlock()
          //     }, util.random(2000, 8000))
          //   }
          // }, 5000)
        }, util.random(3000, 6000))
      }, util.random(1000, 3000))
    },
    mineBlock(block: Header) {
      console.log(block.toJSON())
      const minedBlock: MinedBlock = {
        blockNum: block.number.toNumber(),
        time: Date.now(),
        transactions: 0,
        blockReward: 0,
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