<template lang="pug">
q-page.q-pl-lg.q-pr-lg.q-pt-md
  //- div {{ clientData }}
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
import { Dialog, Notify } from "quasar"
import { globalState as global } from "src/lib/global"
import * as util from "src/lib/util"
import farmedList from "components/farmedList.vue"
import netCard from "components/netCard.vue"
import plotCard from "components/plotCard.vue"
import { emptyClientData, ClientData, FarmedBlock} from "src/lib/types"
const lang = global.data.loc.text.dashboard
export default defineComponent({
  components: { farmedList, netCard, plotCard },
  data() {
    // TODO remove this.client after invariants are protected
    return {
      lang,
      config: <util.ConfigFile>{},
      network: {
        state: "starting",
        message: lang.initializing,
        peers: 0
      },
      plot: {
        state: "starting",
        message: lang.initializing
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
  watch: {},
  async mounted() {
    this.client.validateApiStatus()
    await this.client.init() 
    const config = await util.config.read()
    const valid = util.config.validate(config)
    this.global.status.state = "loading"
    this.global.status.message = "loading..."
    if (!valid) {
      return Dialog.create({
        message: lang.corrupt,
        noEscDismiss: true,
        noBackdropDismiss: true,
        noRouteDismiss: true
      }).onOk(async () => {
        await util.config.clear()
        this.$router.replace({ name: "index" })
      })
    }
    await this.readConfig()
    this.fakeStart()
    this.clientData = global.client.data
    this.loading = false
    this.peerInterval = window.setInterval(this.getNetInfo, 10000)
    // this.client.data.farming.events.on("farmedBlock", this.farmBlock)
    return
  },
  unmounted() {
    this.unsubscribe()
    clearInterval(this.peerInterval)
    this.client.do.blockSubscription.stop()
    // this.client.data.farming.events.off("farmedBlock", this.farmBlock)
  },
  methods: {
    async getNetInfo() {
      const netData = await global.client.status.net()
      this.network.peers = netData.peers.length
    },
    expand(val: boolean) {
      this.expanded = val
    },
    async readConfig() {
      this.config = await util.config.read()
    },
    async fakeStart() {
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
        }, util.random(3000, 6000))
      }, util.random(1000, 3000))
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

<style lang="sass">
.list-move
  transition: transform 0.5s
</style>
