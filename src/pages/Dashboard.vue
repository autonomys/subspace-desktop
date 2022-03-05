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
import { globalState as global } from "src/lib/global"
import * as util from "src/lib/util"
import farmedList from "components/farmedList.vue"
import netCard from "components/netCard.vue"
import plotCard from "components/plotCard.vue"
import { emptyClientData, ClientData, FarmedBlock } from "src/lib/types"

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
      client: global.client,
      globalState: {
        state: "starting",
        message: lang.initializing
      },
      expanded: false,
      util,
      loading: true,
      unsubscribe: (): void => {},
      peerInterval: 0,
      clientData: <ClientData>emptyClientData
    }
  },
  computed: {
    farmedTotalEarned(): number {
      if (!this.client) return 0
      return this.client.data.farming.farmed.reduce((agg, val) => {
        return val.blockReward + val.feeReward + agg
      }, 0)
    }
  },
  async mounted() {
    const appDir = await util.getAppDir()
    const config = await util.config.read(appDir)
    this.plot.plotSizeGB = config.utilCache.allocatedGB

    if (this.client.isFirstLoad() === false) {
      await this.client.connectPublicApi()
      await this.client.waitNodeStartApiConnect(config.plot.nodeLocation)
      await this.client.startFarming(config.plot.location)
      await this.client.startBlockSubscription()
    }

    this.global.status.state = "loading"
    this.global.status.message = "loading..."

    this.clientData = global.client.data
    this.loading = false
    this.peerInterval = window.setInterval(this.getNetInfo, 10000)
    this.client.data.farming.events.on("newBlock", this.newBlock)
    this.client.data.farming.events.on("farmedBlock", this.farmBlock)
    this.global.status.state = "live"
    this.global.status.message = lang.syncedMsg
    this.checkNodeAndNetwork()
    this.checkFarmerAndPlot()
  },
  unmounted() {
    this.unsubscribe()
    clearInterval(this.peerInterval)
    this.client.do.blockSubscription.stop()
    this.client.data.farming.events.off("newBlock", this.newBlock)
    this.client.data.farming.events.off("farmedBlock", this.farmBlock)
  },
  methods: {
    async getNetInfo() {
      const netData = await global.client.status.net()
      this.network.peers = netData.peers.length
    },
    expand(val: boolean) {
      this.expanded = val
    },
    async checkFarmerAndPlot() {
      this.plot.state = "verifying"
      this.plot.message = lang.verifyingPlot

      const lastNetSegmentIndex = await this.client.getNetworkSegmentIndex()
      const totalSize = lastNetSegmentIndex * 256 * util.PIECE_SIZE
      const allocatedGB = Math.round((totalSize * 100) / util.GB) / 100
      this.plot.plotSizeGB = allocatedGB

      this.plot.message = lang.syncedMsg
      this.plot.state = "finished"
    },
    async checkNodeAndNetwork() {
      this.network.state = "verifying"
      this.network.message = lang.verifyingNet

      let blockNumberData = await this.client.getBlocksData()
      do {
        this.network.message = `Syncing node ${blockNumberData[0].toLocaleString()} of ${blockNumberData[1].toLocaleString()} Blocks`
        await new Promise((resolve) => setTimeout(resolve, 3000))
        blockNumberData = await this.client.getBlocksData()
      } while (blockNumberData[0] < blockNumberData[1])

      this.network.message = lang.synced
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
        } SSC`,
        position: "bottom-right"
      })
    }
  }
})
</script>
