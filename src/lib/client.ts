import { ApiPromise, WsProvider, } from '@polkadot/api'
import { Vec } from '@polkadot/types/codec'
import { PeerInfo } from '@polkadot/types/interfaces/system'
import * as event from '@tauri-apps/api/event'
import { reactive } from 'vue'
import { LocalStorage } from 'quasar'
import { AccountId32 } from '@polkadot/types/interfaces';

// import { Header } from '@polkadot/types/interfaces/runtime'
import * as process from 'process'
import mitt, { Emitter } from 'mitt'
import { FarmedBlock } from './types'
import { SubPreDigest } from './customTypes/types'
import { invoke } from '@tauri-apps/api/tauri'

const tauri = { event, invoke }

export interface NetStatus {peers:Vec<PeerInfo>}

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
    farming: ()=>void,
    plot: ()=>void,
    network: ()=>void
  },
  do?: { [index: string]: any }
}

function getStoredBlocks(): FarmedBlock[] {
  const mined: FarmedBlock[] = []
  try {
    const blocks = LocalStorage.getItem('farmedBlocks')
    if (!blocks) return []
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [num, block] of Object.entries(blocks)) {
      mined.push(block as FarmedBlock)
    }
  } catch (error) {
    console.error(error, 'error reading stored blocks')
  }
  return mined
}

function storeBlocks(blocks: FarmedBlock[]):void {
  const farmed: { [index: string]: FarmedBlock } = {}
  for (const block of blocks) {
    farmed[block.id] = block
  }
  LocalStorage.set('farmedBlocks', farmed)
}

function clearStored():void {
  try {
    LocalStorage.remove('farmedBlocks')
  } catch (error) {
    console.error('error clearing mined blocks')
  }
}

//TODO should be refactored to not rely on the .init() method to be valid
export class Client {
  protected wsProvider = new WsProvider("ws://localhost:9944");
  protected api: ApiPromise = new ApiPromise({ provider: this.wsProvider });
  protected farmed = getStoredBlocks();
  protected clearTauriDestroy: event.UnlistenFn = () => { };
  protected unsubscribe: event.UnlistenFn = () => { };
  data = reactive(emptyData);

  status = {
    farming: ():void => { }, // TODO return some farming status info
    plot: ():void => { }, // TODO return some plot status info
    net: async ():Promise<NetStatus> => {
      const peers = await this.api.rpc.system.peers()
      return {peers}
    }
  }
  do = {
    blockSubscription: {
      clearStored,
      stopOnReload():void {
        this.stop()
      },
      start: async ():Promise<void> => {
        const farmerPublicKey: AccountId32 = this.api.registry.createType('AccountId32', LocalStorage.getItem('farmerPublicKey'));
        this.unsubscribe = await this.api.rpc.chain.subscribeNewHeads(
          async (lastHeader) => {
            const signedBlock = await this.api.rpc.chain.getBlock(
              lastHeader.hash
            );
            const preRuntimes = signedBlock.block.header.digest.logs.filter(
              (log) => log.isPreRuntime && log.asPreRuntime[0].toString() === 'SUB_'
            );
            const { solution }: SubPreDigest = this.api.registry.createType('SubPreDigest', preRuntimes[0].asPreRuntime[1]);

            if (solution.public_key.toString() === farmerPublicKey?.toString()) {
              const block: FarmedBlock = {
                author: solution.public_key.toString(),
                id: lastHeader.hash.toString(),
                time: Date.now(),
                transactions: 0,
                blockNum: lastHeader.number.toNumber(),
                blockReward: 0,
                feeReward: 0,
              };
              this.data.farming.farmed = [block].concat(
                this.data.farming.farmed
              );
              storeBlocks(this.farmed);
            }
          })
        process.on('beforeExit', this.do.blockSubscription.stopOnReload)
        window.addEventListener('unload', this.do.blockSubscription.stopOnReload)
        this.clearTauriDestroy = await tauri.event.once('tauri://destroyed', () => {
          console.log('Destroyed event!')
          storeBlocks(this.data.farming.farmed)
        })
      },
      stop: ():void => {
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
      runTest():void {
        this.start()
      }
    }
  }
  constructor() {
    this.data.farming.farmed = this.farmed
  }
  async init():Promise<void> {
    this.api = await ApiPromise.create({
      provider: this.wsProvider, types: {
        Solution: {
          public_key: 'AccountId32'
        },
        SubPreDigest: {
          slot: 'u64',
          solution: 'Solution'
        }
      }
    })
  }
}

export async function startFarming(path: string): Promise<string> {
  const public_key = (await tauri.invoke('farming', { path })) as string
  console.log(`This is CLIENT.TS: Received the public key: ${public_key}`)
  return public_key
}
