import { ApiPromise, WsProvider } from '@polkadot/api'
import * as event from '@tauri-apps/api/event'
import { reactive } from 'vue'
import { LocalStorage } from 'quasar'
const tauri = { event }
// import { Header } from '@polkadot/types/interfaces/runtime'
import * as process from 'process'
import mitt, { Emitter } from 'mitt'
import { FarmedBlock } from './types'
import { FarmerId, PoCPreDigest, Solution } from './customTypes/types'
import customTypes from './customTypes/customTypes.json'

export interface PeerData {
  status: 'disconnected' | 'unstable' | 'connected' | string
  name: string // do peers have some string identifier?
  ip: string
  receivedBytes: number
  sentBytes: number
}

export interface ClientNetwork {
  status: 'disconnected' | 'unstable' | 'connected' | string
  peers: PeerData[]
  details: {
    // physical network interface
    // more granular connection information here
  }
}

export interface ClientPlot {
  status: 'active' | 'verifying' | 'corrupted' | 'syncing' | string
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
  status: 'active' | 'paused' | string
  farmed: FarmedBlock[],
  events: Emitter<any>
}

export interface ClientData {
  plot: ClientPlot
  network: ClientNetwork
  farming: ClientFarming
}

export const emptyData: ClientData = {
  plot: { details: {}, plotFile: '', plotSizeBytes: 0, status: '' },
  farming: { farmed: [], status: '', events: mitt() },
  network: { details: {}, peers: [], status: '' }
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
    const blocks = LocalStorage.getItem('farmedBlocks')
    if (!blocks) return []
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (let [num, block] of Object.entries(blocks)) {
      mined.push(block as FarmedBlock)
    }
  } catch (error) {
    console.error(error, 'error reading stored blocks')
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
    console.error('error clearing mined blocks')
  }
}

export class Client {
  wsProvider = new WsProvider
  api: ApiPromise = new ApiPromise
  farmed = getStoredBlocks()
  clientData = reactive(emptyData)
  data = emptyData
  clearTauriDestroy: event.UnlistenFn = () => { }
  unsubscribe: event.UnlistenFn = () => { }
  constructor() {
    this.clientData.farming.farmed = this.farmed
  }
  async init() {
    this.api = await ApiPromise.create({ provider: this.wsProvider, types: customTypes })
  }
  status = {
    farming: () => { }, // return some farming status info
    plot: () => { }, // return some plot status info
    net: () => { } // return some net status info
  }
  do = {
    blockSubscription: {
      clearStored,
      stopOnReload(this: any, ev: Event) {
        ev.preventDefault()
        this.stop()
      },
      start: async () => {
        this.unsubscribe = await this.api.rpc.chain.subscribeNewHeads(async (lastHeader) => {
          const signedBlock = await this.api.rpc.chain.getBlock(lastHeader.hash)
          for (const log of signedBlock.block.header.digest.logs) {
            if (log.isPreRuntime) {
              const [type, data] = log.asPreRuntime
              if (type.toString() === 'POC_') {
                const poCPreDigest: PoCPreDigest = this.api.registry.createType('PoCPreDigest', data)
                const solution: Solution = this.api.registry.createType('Solution', poCPreDigest.solution)
                const farmerId: FarmerId = this.api.registry.createType('FarmerId', solution.public_key)
                console.log('farmerId: ', farmerId.toString())
              }
            }
          }
          const block: FarmedBlock = { id: lastHeader.hash.toString(), time: Date.now(), transactions: 0, blockNum: lastHeader.number.toNumber(), blockReward: 0, feeReward: 0 }
          this.data.farming.farmed = [block].concat(this.data.farming.farmed)
          storeBlocks(this.farmed)
          // this.data.farming.events.emit('farmedBlock', block)
          // const peers = await this.api.rpc.system.peers()
          // console.log('Peers: ', peers)
          // console.log('PeersCount: ', peers.length)
        })
        process.on('beforeExit', this.do.blockSubscription.stopOnReload)
        window.addEventListener('unload', this.do.blockSubscription.stopOnReload)
        this.clearTauriDestroy = await tauri.event.once('tauri://destroyed', () => {
          console.log('Destroyed event!')
          storeBlocks(this.data.farming.farmed)
        })
      },
      stop: () => {
        console.log('block subscription stop triggered')
        this.unsubscribe()
        try {
          this.clearTauriDestroy()
          storeBlocks(this.data.farming.farmed)
          window.removeEventListener('unload', this.do.blockSubscription.stopOnReload)
        } catch (error) {
          console.error(error)
        }
      },
      runTest() {
        this.start()
      }
    }
  }
}
