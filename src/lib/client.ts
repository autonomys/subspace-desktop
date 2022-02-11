import { ApiPromise, WsProvider, } from '@polkadot/api'
import { Vec } from '@polkadot/types/codec'
import * as event from '@tauri-apps/api/event'
import { reactive } from 'vue'
import { LocalStorage } from 'quasar'
import { AccountId32 } from '@polkadot/types/interfaces';
import * as process from 'process'
import { ClientIdentity, emptyClientData, FarmedBlock, NetStatus } from './types'
import { SubPreDigest } from './customTypes/types'
import { invoke } from '@tauri-apps/api/tauri'
import * as util from "src/lib/util"

const tauri = { event, invoke }
const SUNIT = 1000000000000000000;
export class Client {
  protected wsProvider = new WsProvider("ws://localhost:9944");
  protected api: ApiPromise = new ApiPromise({ provider: this.wsProvider });
  protected farmed: FarmedBlock[] = [];
  protected clearTauriDestroy: event.UnlistenFn = () => { };
  protected unsubscribe: event.UnlistenFn = () => { };
  data = reactive(emptyClientData);
  protected clientStarted = false;

  status = {
    farming: (): void => { }, // TODO return some farming status info
    plot: (): void => { }, // TODO return some plot status info
    net: async (): Promise<NetStatus> => {
      const peers = await this.api.rpc.system.peers()
      return { peers }
    }
  }
  do = {
    blockSubscription: {
      stopOnReload(): void {
        this.stop()
      },
      start: async (): Promise<void> => {
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
              let blockReward = 0;
              const allRecords: Vec<any> = await this.api.query.system.events.at(lastHeader.hash);
              allRecords.forEach((record) => {
                const { section, method, data } = record.event;
                if (section === "rewards" && method === "BlockReward")
                  blockReward = data[1] / SUNIT;
                if (section === "transactionFees")
                  console.log("transactionFees event::", section, method, data);
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
            }
          })
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
        try {
          this.clearTauriDestroy()
          this.storeBlocks(this.data.farming.farmed)
          window.removeEventListener('unload', this.do.blockSubscription.stopOnReload)
        } catch (error) {
          console.error(error)
        }
      },
      startSubcriptions(): void {
        this.start()
      }
    }
  }
  constructor() {
  }

  public async init(clear: boolean = false, farmerPublicKey?: string | undefined, mnemonic?: string | undefined): Promise<void> {
    if (farmerPublicKey && mnemonic) {
      LocalStorage.set("farmerPublicKey", farmerPublicKey)
      LocalStorage.set("mnemonic", mnemonic)
      util.config.update({ account: { pubkey: farmerPublicKey } })
    }

    if (clear)
      this.clearStoredBlocks()
    else
      this.loadStoredBlocks()

    if (!this.clientStarted) {
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
      this.do.blockSubscription.startSubcriptions()
    }

    this.clientStarted = true;
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
}

export async function startFarming(path: string): Promise<ClientIdentity> {
  return tauri.invoke('farming', { path });
}
