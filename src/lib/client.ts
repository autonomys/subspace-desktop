import { ApiPromise, WsProvider } from '@polkadot/api';
import * as event from "@tauri-apps/api/event"
import { reactive } from 'vue'
import { LocalStorage } from 'quasar'
const tauri = { event }
// import { Header } from "@polkadot/types/interfaces/runtime"
import { VoidFn } from "@polkadot/api/types"
import * as process from "process"
import mitt, { Emitter } from 'mitt'
import { FarmedBlock } from "./types"


export interface PeerData {
  status: "disconnected" | "unstable" | "connected" | string
  name: string // do peers have some string identifier?
  ip: string
  receivedBytes: number
  sentBytes: number
}

export interface ClientNetwork {
  status: "disconnected" | "unstable" | "connected" | string
  peers: PeerData[]
  details: {
    // physical network interface
    // more granular connection information here
  }
}

export interface ClientPlot {
  status: "active" | "verifying" | "corrupted" | "syncing" | string
  plotSizeBytes: number // size of the plot file in Bytes
  plotFile: string // drive directory where the plot file is located
  details: {
    // additional information could be placed here
  }
}

export interface Block {
  id: string
  time: Date
  transactions: string[]
  reward: number
  fees: number
}

export interface ClientFarming {
  status: "active" | "paused" | string
  farmed: FarmedBlock[],
  events: Emitter<any>
}

export interface ClientData {
  plot: ClientPlot
  network: ClientNetwork
  farming: ClientFarming
}

export const emptyData: ClientData = {
  plot: { details: {}, plotFile: "", plotSizeBytes: 0, status: "" },
  farming: { farmed: [], status: "", events: mitt() },
  network: { details: {}, peers: [], status: "" }
}

export interface ClientType {
  api: ApiPromise | null
  data: ClientData
  getStatus: {
    farming: Function
    plot: Function
    network: Function
  },
  do?: { [index: string]: any }
}


function getStoredBlocks(): FarmedBlock[] {
  let mined: FarmedBlock[] = []
  try {
    const blocks = LocalStorage.getItem('farmedBlocks') as {}
    // eslint-disable-next-line no-unused-vars
    for (let [num, block] of Object.entries(blocks)) {
      mined.push(block as FarmedBlock)
    }
  } catch (error) {
    console.error(error, 'error reading stored blocks');
  }
  return mined
}

function storeBlocks(blocks: FarmedBlock[]) {
  let farmed: { [index: string]: FarmedBlock } = {}
  for (const block of blocks) {
    farmed[block.id] = block
  }
  LocalStorage.set('farmedBlocks', farmed)
}

function clearStored() {
  try {
    LocalStorage.remove('farmedBlocks')
  } catch (error) {
    console.error("error clearing mined blocks")
  }
}

export const Client = async () => {
  const wsProvider = new WsProvider();
  const api = await ApiPromise.create({ provider: wsProvider });
  console.log(api.genesisHash.toHex());
  console.log('init client...');
  let unsubscribe: VoidFn = () => { }
  // clearStored()
  let farmed: FarmedBlock[] = getStoredBlocks()
  let clientData = reactive(emptyData)
  let clearTauriDestroy: event.UnlistenFn = () => { }
  clientData.farming.farmed = farmed

  const client = <ClientType>{
    api,
    data: clientData,
    getStatus: {
      async farming() { },
      async plot() { },
      async network() { }
    },
    do: {
      unsubscribe,
      blockSubscription: {
        unsubscribe,
        processSubscription: {},
        clearStored,
        clearTauriDestroy,
        stopOnReload(this: any, ev: Event) {
          ev.preventDefault()
          client.do?.blockSubscription.stop()
        },
        async start() {
          if (!client.api) throw (Error("Api Missing, can't start block subscription yet."))

          api.derive.chain.subscribeNewHeads((header) => {
            console.log(`#${header.number} AUTHOR: ${header.author}`);
          });

          this.unsubscribe = await client.api.rpc.chain.subscribeNewHeads(async (lastHeader) => {
            console.log(`last block #${lastHeader.number} has hash ${lastHeader.hash}`)
            const signedBlock = await api.rpc.chain.getBlock(lastHeader.hash);
            // signedBlock.block.
            console.log(`signedBlock:`, signedBlock);
            const allRecords = await api.query.system.events.at(signedBlock.block.header.hash)
            signedBlock.block.extrinsics.forEach(({ method: { method, section } }, index) => {
              const events = allRecords.filter(({ phase }) => phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(index))
                .map(({ event }) => `${event.section}.${event.method}`)
              console.log(`${section}.${method}:: ${events.join(', ') || 'no events'}`)
            })

            const block: FarmedBlock = { id: lastHeader.hash.toString(), time: Date.now(), transactions: 0, blockNum: lastHeader.number.toNumber(), blockReward: 0, feeReward: 0 }
            client.data.farming.farmed = [block].concat(client.data.farming.farmed)
            storeBlocks(farmed)
            client.data.farming.events.emit('farmedBlock', block)
            const peers = await client?.api?.rpc.net.peerCount
            console.log("Peers", peers) // this is undefined?
          })
          process.on('beforeExit', this.stopOnReload);
          window.addEventListener('unload', this.stopOnReload)
          this.clearTauriDestroy = await tauri.event.once('tauri://destroyed', () => {
            console.log('Destroyed event!');

            storeBlocks(client.data.farming.farmed)
          })
        },
        stop() {
          console.log('block subscription stop triggered');
          this.unsubscribe()
          try {
            this.clearTauriDestroy()
            storeBlocks(client.data.farming.farmed)
            window.removeEventListener('unload', this.stopOnReload)
          } catch (error) {
            console.error(error)
          }
        }
      },
      async runTest() {
        // client.do?.blockSubscription.clearStored()
        client.do?.blockSubscription.start()
        // if (!client.api) return
        // const ready = await client.api.isConnected
        // console.log("api:", ready)
        // const state = await client.api.query.system.number
        // console.log("state:", state)
        // const time = await client.api.query.timestamp.now()
        // console.log("time:", time.toHuman())
        // const chain = await client.api.rpc.system.chain()
        // const lastHeader = await client.api.rpc.chain.getHeader()


        // this.unsubscribe()
        // const farmed = client.data.farming.farmed

        // const subscribeNewBlocks = client.api.derive.chain.subscribeNewBlocks
        // subscribeNewBlocks((block) => {
        //   console.log("block Events:", block.events.length)
        //   console.log("block author:", block.author)
        // })
      }
      // startPlotting()
      // stopPlotting()
      // startFarming()
      // stopFarming()
      // restartClient()
      // stopClient()
      // startClient()
    }
  }
  return client
}

