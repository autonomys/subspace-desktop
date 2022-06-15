<template lang="pug">
q-page.q-pl-lg.q-pr-lg.q-pt-md
  .row.justify-center
  .row.q-pb-sm.justify-center
  div(v-if="!loading")
    .row.q-gutter-md.q-pb-md(v-if="!expanded")
      .col
        plotCard(:plot="plot")
      .col
        netCard(:network="network")
    .row.q-gutter-md
      .col
        farmedList(
          :expanded="expanded"
          :farmedTotalEarned="farmedTotalEarned"
          @expand="expand"
        )
  div(v-else)
    .flex
      .absolute-center
        .row.justify-center
          q-spinner-orbit(color="grey" size="120px")
        h4 Connecting to client...
</template>

<script lang="ts">
import { defineComponent } from "vue"
import { Notify } from "quasar"
import { globalState as global } from "../lib/global"
import * as util from "../lib/util"
import farmedList from "../components/farmedList.vue"
import netCard from "../components/netCard.vue"
import plotCard from "../components/plotCard.vue"
import { emptyClientData, ClientData, FarmedBlock } from "../lib/types"
import { appConfig } from "../lib/appConfig"
const lang = global.data.loc.text.dashboard

export default defineComponent({
  components: { farmedList, netCard, plotCard },
  data() {
    // TODO remove this.client after invariants are protected
    return {
      lang,
      network: {
        state: "starting",
        message: lang.initializing,
        peers: 0
      },
      plot: {
        state: "starting",
        message: lang.initializing,
        plotSizeGB: 0
      },
      global: global.data,
      globalState: {
        state: "starting",
        message: lang.initializing
      },
      expanded: false,
      util,
      loading: true,
      unsubscribe: () => null,
      peerInterval: 0,
      clientData: <ClientData>emptyClientData
    }
  },
  computed: {
    farmedTotalEarned(): number {
      if (!this.$client) return 0
      return this.$client.data.farming.farmed.reduce((agg: number, val: { blockReward: number, feeReward: number }) => {
        return val.blockReward + val.feeReward + agg
      }, 0)
    }
  },
  async mounted() {
    const config = await appConfig.read()
    this.plot.plotSizeGB = config.plot.sizeGB

    if (this.$client.isFirstLoad() === false) {
      util.infoLogger("DASHBOARD | starting node")
      if (config.nodeName !== "") {
        await this.$client.startNode(config.plot.location, config.nodeName)
      } else {
        util.errorLogger("DASHBOARD | node name was empty when tried to start node")
      }
      util.infoLogger("DASHBOARD | starting farmer")
      const farmerStarted = await this.$client.startFarming(config.plot.location, config.plot.sizeGB)
      if (!farmerStarted) {
        util.errorLogger("DASHBOARD | Farmer start error!")
      }
      util.infoLogger("DASHBOARD | starting block subscription")
      await this.$client.startSubscription();
    }

    this.global.status.state = "loading"
    this.global.status.message = "loading..."

    this.clientData = this.$client.data
    this.loading = false

    this.fetchPeersCount();// fetch initial peers count value
    this.peerInterval = window.setInterval(this.fetchPeersCount, 30000);

    this.$client.data.farming.events.on("newBlock", this.newBlock)
    this.$client.data.farming.events.on("farmedBlock", this.farmBlock)
    this.global.status.state = "live"
    this.global.status.message = lang.syncedMsg
    await this.checkNodeAndNetwork()
    await this.checkFarmerAndPlot()
  },
  unmounted() {
    this.unsubscribe()
    clearInterval(this.peerInterval)
    this.$client.stopSubscription()
    this.$client.data.farming.events.off("newBlock", this.newBlock)
    this.$client.data.farming.events.off("farmedBlock", this.farmBlock)
  },
  methods: {
    async fetchPeersCount() {
      const peers = await this.$client.getPeersCount();
      this.network.peers = peers;
    },
    expand(val: boolean) {
      this.expanded = val
    },
    async checkFarmerAndPlot() {
      this.plot.state = "verifying"
      this.plot.message = lang.verifyingPlot

      const config = await appConfig.read()
      this.plot.plotSizeGB = config.plot.sizeGB

      this.plot.message = lang.syncedMsg
      this.plot.state = "finished"
    },
    async checkNodeAndNetwork() {
      this.network.state = "verifying"
      this.network.message = lang.verifyingNet

      let syncState = await this.$client.getSyncState()
      do {
        this.network.message = `Syncing node ${syncState.currentBlock} of ${syncState.highestBlock} Blocks`
        await new Promise((resolve) => setTimeout(resolve, 3000))
        syncState = await this.$client.getSyncState()
      } while (syncState.currentBlock.toNumber() < syncState.highestBlock.unwrapOrDefault().toNumber())

      this.network.message = `Node is synced at block: ${syncState.currentBlock}`
      this.network.state = "finished"
    },
    newBlock(blockNumber: number) {
      if (this.network.state === "finished")
        this.network.message =
          "Synced at " + lang.blockNum + " " + blockNumber.toLocaleString()
    },
    farmBlock(block: FarmedBlock) {
      Notify.create({
        color: "green",
        progress: true,
        message: `${lang.farmedBlock}: ${block.blockNum} ${lang.reward} ${
          block.blockReward + block.feeReward
        } testSSC`,
        position: "bottom-right"
      })
    }
  }
})
</script>
