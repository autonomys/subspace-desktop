import { ApiPromise, WsProvider, } from '@polkadot/api'
import type { Vec } from '@polkadot/types/codec'
import type { AccountId32, Hash } from '@polkadot/types/interfaces';
import * as event from '@tauri-apps/api/event'
import { reactive } from 'vue'
import { LocalStorage } from 'quasar'
import * as process from 'process'
import { ClientIdentity, emptyClientData, FarmedBlock, NetStatus } from './types'
import { SubPreDigest } from './customTypes/types'
import { invoke } from '@tauri-apps/api/tauri'
import * as util from 'src/lib/util'

const tauri = { event, invoke }
const SUNIT = 1000000000000000000

const NETWORK_RPC = process.env.PUBLIC_API_WS || 'ws://localhost:9944'
const LOCAL_RPC = process.env.LOCAL_API_WS || 'ws://localhost:9944'

export class Client {
  protected publicApi: ApiPromise = new ApiPromise({ provider: new WsProvider(NETWORK_RPC), types: util.apiTypes });
  protected localApi: ApiPromise = new ApiPromise({ provider: new WsProvider(LOCAL_RPC, false), types: util.apiTypes,  });
  protected farmed: FarmedBlock[] = [];
  protected clearTauriDestroy: event.UnlistenFn = () => { };
  protected unsubscribe: event.UnlistenFn = () => { };
  data = reactive(emptyClientData);
  protected clientStarted = false;
  protected mnemonic = '';

  status = {
    farming: (): void => { }, // TODO return some farming status info
    plot: (): void => { }, // TODO return some plot status info
    net: async (): Promise<NetStatus> => {
      const peers = await this.localApi.rpc.system.peers()
      return { peers }
    }
  }
  do = {
    blockSubscription: {
      stopOnReload(): void {
        this.stop()
      },
      start: async (): Promise<void> => {
        const { account } = await util.config.read()
        if(account?.farmerPublicKey){
          const farmerPublicKey: AccountId32 = this.localApi.registry.createType('AccountId32', account.farmerPublicKey);
          this.unsubscribe = await this.localApi.rpc.chain.subscribeNewHeads(
            async (lastHeader) => {
              const signedBlock = await this.localApi.rpc.chain.getBlock(
                lastHeader.hash
              );
              const preRuntimes = signedBlock.block.header.digest.logs.filter(
                (log) => log.isPreRuntime && log.asPreRuntime[0].toString() === 'SUB_'
              );
              const { solution }: SubPreDigest = this.localApi.registry.createType('SubPreDigest', preRuntimes[0].asPreRuntime[1]);
              console.log('New Block:', lastHeader.number.toNumber(), 'Farmed by me:', solution.public_key.eq(farmerPublicKey)?'YES':'NO')
              if (solution.public_key.eq(farmerPublicKey)) {
                let blockReward = 0;
                const allRecords: Vec<any> = await this.localApi.query.system.events.at(lastHeader.hash);
                allRecords.forEach((record) => {
                  const { section, method, data } = record.event;
                  if (section === 'rewards' && method === 'BlockReward')
                    blockReward = data[1] / SUNIT;
                  if (section === 'transactionFees')
                    console.log('transactionFees event::', section, method, data);
                });
                const block: FarmedBlock = {
                  author: solution.public_key.toString(),
                  id: lastHeader.hash.toString(),
                  time: Date.now(),
                  transactions: 0,
                  blockNum: lastHeader.number.toNumber(),
                  blockReward,
                  feeReward: 0
                };
                this.data.farming.farmed = [block].concat(
                  this.data.farming.farmed
                );
                this.storeBlocks(this.data.farming.farmed)
                this.data.farming.events.emit('farmedBlock', block)
              }
              this.data.farming.events.emit('newBlock', lastHeader.number.toNumber())
            })
        }
        process.on('beforeExit', this.do.blockSubscription.stopOnReload)
        window.addEventListener('unload', this.do.blockSubscription.stopOnReload)
        this.clearTauriDestroy = await tauri.event.once('tauri://destroyed', () => {
          console.log('Destroyed event!')
          this.storeBlocks(this.data.farming.farmed)
        })
      },
      stop: (): void => {
        console.log('block subscription stop triggered')
        this.unsubscribe()
        this.clientStarted = false
        this.localApi.disconnect()
        this.publicApi.disconnect()
        try {
          this.clearTauriDestroy()
          this.storeBlocks(this.data.farming.farmed)
          window.removeEventListener('unload', this.do.blockSubscription.stopOnReload)
        } catch (error) {
          console.error(error)
        }
      },
    }
  }
  constructor() {
  }

  // If the app is started for the first time, the client will be started from PlottingProgress page.
  // If the app is started for the second time, the client will be started from Dashboard page.
  public async init(farmerPublicKey?: string, mnemonic?: string): Promise<void> {
      if (!this.clientStarted) {
        const { account } = await util.config.read()
        if (farmerPublicKey && mnemonic && account) {
          await util.config.update({ account: { farmerPublicKey, passHash: account.passHash } })
          this.clearStoredBlocks()
          this.mnemonic = mnemonic
        } else {
          this.loadStoredBlocks()
        }
        this.do.blockSubscription.start()
        this.clientStarted = true;
    }
  }

  public clearMnemonic(): void {
    this.mnemonic = '';
  }

  public getMnemonic(): string {
    return this.mnemonic 
  }

  public async getNetworkLastBlockNumber(): Promise<number> {
    const signedBlock = await this.publicApi.rpc.chain.getBlock();
    return signedBlock.block.header.number.toNumber()
  }

  public async getLocalLastBlockNumber(): Promise<number> {
    const signedBlock = await this.localApi.rpc.chain.getBlock();
    return signedBlock.block.header.number.toNumber()
  }
  
  public async getNetworkSegmentIndex(hash?: Hash): Promise<number> {
    let signedBlock;
    if (hash) signedBlock = await this.publicApi.rpc.chain.getBlock(hash);
    else signedBlock = await this.publicApi.rpc.chain.getBlock();       
    if (signedBlock.block.header.number.toNumber() === 0) return 1;

    else {
      const allRecords: Vec<any> = await this.publicApi.query.system.events.at(signedBlock.block.header.parentHash);
      for (const record of allRecords) {
        const { section, method, data } = record.event;
        if (section === 'subspace' && method === 'RootBlockStored'){
          const segmentIndex = data[0].asV0.segmentIndex.toNumber()
          return segmentIndex <= 1 ? 1 : segmentIndex
        }
      }
      return await this.getNetworkSegmentIndex(signedBlock.block.header.parentHash)
    }
  }

  private getStoredBlocks(): FarmedBlock[] {
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

  private storeBlocks(blocks: FarmedBlock[]): void {
    const farmed: { [index: string]: FarmedBlock } = {}
    for (const block of blocks) {
      farmed[block.id] = block
    }
    LocalStorage.set('farmedBlocks', farmed)
  }

  private clearStoredBlocks(): void {
    try {
      LocalStorage.remove('farmedBlocks')
    } catch (error) {
      console.error('error clearing mined blocks')
    }
  }

  private loadStoredBlocks(): void {
    this.farmed = this.getStoredBlocks();
    this.data.farming.farmed = this.farmed
  }

  public async validateApiStatus(pub:boolean, loc:boolean): Promise<void> {
    if(pub && !this.publicApi.isConnected) 
      this.publicApi = new ApiPromise({ provider: new WsProvider(NETWORK_RPC), types: util.apiTypes });
    if(loc && !this.localApi.isConnected) 
      this.localApi = new ApiPromise({ provider: new WsProvider(LOCAL_RPC), types: util.apiTypes });
    await Promise.all([this.localApi.isReady, this.publicApi.isReady])
  }
}

export async function startFarming(path: string): Promise<ClientIdentity> {
  return await tauri.invoke('farming', { path });
}

export async function getLocalFarmerSegmentIndex(): Promise<number> {
  const plot_progress_tracker = (await tauri.invoke('plot_progress_tracker') as number) / 256 
  return plot_progress_tracker <= 1 ? 1 : plot_progress_tracker - 1;
}

export async function startNode(path: string): Promise<any> {
  return await tauri.invoke("start_node", { path })
}
