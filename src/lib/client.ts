import { ApiPromise, Keyring, WsProvider } from "@polkadot/api"
import type { Vec } from "@polkadot/types/codec"
import type { u128, u32 } from "@polkadot/types"
import { mnemonicGenerate } from "@polkadot/util-crypto"
import * as event from "@tauri-apps/api/event"
import { invoke } from "@tauri-apps/api/tauri"
import { reactive } from "vue"
import * as process from "process"
import * as util from "src/lib/util"
import { appConfig } from "./appConfig"
import { getStoredBlocks, storeBlocks } from "./blockStorage"
import {
  emptyClientData,
  NetStatus,
  FarmedBlock,
  SubPreDigest
} from "src/lib/types"
import EventEmitter from "events"

export const myEmitter = new EventEmitter();


const tauri = { event, invoke }
const SUNIT = 1000000000000000000n

const NETWORK_RPC = process.env.PUBLIC_API_WS || "ws://localhost:9944"
const LOCAL_RPC = process.env.LOCAL_API_WS || "ws://localhost:9944"
const appsLink = "https://polkadot.js.org/apps/?rpc=" + NETWORK_RPC + "#/explorer/query/"
export class Client {
  protected firstLoad = false
  protected mnemonic = ""
  protected publicApi: ApiPromise = new ApiPromise({
    provider: new WsProvider(NETWORK_RPC, false),
    types: util.apiTypes
  })
  protected localApi: ApiPromise = new ApiPromise({
    provider: new WsProvider(LOCAL_RPC, false),
    types: util.apiTypes
  })
  protected farmed: FarmedBlock[] = []
  protected clearTauriDestroy: event.UnlistenFn = () => {}
  protected unsubscribe: event.UnlistenFn = () => {}
  data = reactive(emptyClientData)
  status = {
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

        const farmerAddress: string | undefined = appConfig.getAppConfig()?.rewardAddress
        if (!farmerAddress) {
          console.error("Reward address should not have been null/undefined...")
          return
        }

        this.unsubscribe = await this.localApi.rpc.chain.subscribeNewHeads(
          async ({ hash, number }) => {
            const blockNum = number.toNumber()
            const signedBlock = await this.localApi.rpc.chain.getBlock(hash)
            const preRuntime: SubPreDigest = this.localApi.registry.createType(
              'SubPreDigest',
              signedBlock.block.header.digest.logs.find((digestItem) => digestItem.isPreRuntime)
            ?.asPreRuntime![1]);

            if (preRuntime.solution.reward_address.toString() === farmerAddress) {
              console.log("Farmed by me:", blockNum)
              let blockReward = 0
              const allRecords: Vec<any> =
                await this.localApi.query.system.events.at(hash)
              allRecords.forEach((record) => {
                const { section, method, data } = record.event
                if (section === "rewards" && method === "BlockReward") {
                  const reward: u128 = this.localApi.registry.createType(
                    "u128",
                    data[1]
                  )
                  blockReward = Number((reward.toBigInt() * 100n) / SUNIT) / 100
                } else if (section === "transactionFees") {
                  // TODO
                }
              })

              const block: FarmedBlock = {
                id: hash.toString(),
                time: Date.now(),
                transactions: 0,
                blockNum,
                blockReward,
                feeReward: 0,
                rewardAddr: farmerAddress.toString(),
                appsLink: appsLink + blockNum.toString()
              }
              this.data.farming.farmed = [block].concat(
                this.data.farming.farmed
              )
              storeBlocks(this.data.farming.farmed)
              this.data.farming.events.emit("farmedBlock", block)

            }
            this.data.farming.events.emit("newBlock", blockNum)
          }
        )
        process.on("beforeExit", this.do.blockSubscription.stopOnReload)
        window.addEventListener(
          "unload",
          this.do.blockSubscription.stopOnReload
        )
        this.clearTauriDestroy = await tauri.event.once(
          "tauri://destroyed",
          () => {
            console.log("Destroyed event!")
            storeBlocks(this.data.farming.farmed)
          }
        )
      },
      stop: (): void => {
        console.log("block subscription stop triggered")
        this.unsubscribe()
        this.localApi.disconnect()
        this.publicApi.disconnect()
        try {
          this.clearTauriDestroy()
          storeBlocks(this.data.farming.farmed)
          window.removeEventListener(
            "unload",
            this.do.blockSubscription.stopOnReload
          )
        } catch (error) {
          console.error(error)
        }
      }
    }
  }

  constructor() {}

  public async startBlockSubscription(): Promise<void> {
    await this.do.blockSubscription.start()
  }

  /* To be called ONLY from plotting progress */
  public setFirstLoad(): void {
    this.firstLoad = true
  }
  /* To be called from dashboard, if isFirstLoad dashboard will not start NODE or FARMER as plottingProgress page already done this and also started block subscriptions. */
  public isFirstLoad(): boolean {
    return this.firstLoad
  }

  /* Connect to LOCAL node - localhost:9944 */
  public async connectLocalApi(): Promise<void> {
    if (!this.localApi.isConnected) {
      await this.localApi.connect()
    }
    await this.localApi.isReady
  }
  /* Connect to PUBLIC-rpc node - Example: farm-rpc.subspace.network */
  public async connectPublicApi(): Promise<void> {
    if (!this.publicApi.isConnected) {
      await this.publicApi.connect()
    }
    await this.publicApi.isReady
  }

   /* Disconnects from PUBLIC-rpc node - Example: farm-rpc.subspace.network */
  public async disconnectPublicApi(): Promise<void> {
    await this.publicApi.disconnect()
  }

  public async getBlocksData(): Promise<[number, number]> {
    const blocksNumbers = await Promise.all([
      this.getLocalLastBlockNumber(),
      this.getNetworkLastBlockNumber()
    ])
    return blocksNumbers
  }

  /* BLOCK NUMBERS */
  // Used to check and display LOCAL node status vs latest network block
  public async getLocalLastBlockNumber(): Promise<number> {
    const signedBlock = await this.localApi.rpc.chain.getBlock()
    return signedBlock.block.header.number.toNumber()
  }
  // Used to check and display LOCAL node status vs latest network block
  public async getNetworkLastBlockNumber(): Promise<number> {
    const signedBlock = await this.publicApi.rpc.chain.getBlock()
    return signedBlock.block.header.number.toNumber()
  }

  public async getLocalSegmentCount(): Promise<number> {
    const plot_progress_tracker =
      ((await invoke("plot_progress_tracker")) as number) / 256
    return plot_progress_tracker <= 1 ? 1 : plot_progress_tracker - 1
  }
  public async getNetworkSegmentCount(): Promise<number> {
    const recordsRoot = await this.publicApi.query.subspace.counterForRecordsRoot() as u32
    return recordsRoot.toNumber()
  }

  /* NODE INTEGRATION */
  public async waitNodeStartApiConnect(path: string): Promise<void> {
    await this.startNode(path)
    // TODO: workaround in case node takes some time to fully start.
    await new Promise((resolve) => setTimeout(resolve, 7000))
    await this.connectLocalApi()
  }

  // TODO: Disable mnemonic return from tauri commmand instead of this validation.
  private async startNode(path: string): Promise<void> {
    const nodeName: string = await tauri.invoke("start_node", { path })
    myEmitter.emit("nodeName", nodeName)
    if (!this.firstLoad) {
      this.loadStoredBlocks()
    }
  }

  private loadStoredBlocks(): void {
    this.farmed = getStoredBlocks()
    this.data.farming.farmed = this.farmed
  }

  public async createRewardAddress(): Promise<void> {
    const mnemonic = mnemonicGenerate()
    const keyring = new Keyring()
    const pair = keyring.createFromUri(mnemonic)
    keyring.setSS58Format(2254); // 2254 is the prefix for subspace-testnet
    appConfig.updateAppConfig(null, null, null, pair.address, null)
    this.mnemonic = mnemonic
  }

  /* FARMER INTEGRATION */
  public async startFarming(path: string, plotSizeGB: number): Promise<boolean> {
    const plotSize = Math.round(plotSizeGB * 1048576)
    const rewardAddress: string | undefined = appConfig.getAppConfig()?.rewardAddress
    if (!rewardAddress) {
      console.error("Tried to send empty reward address to backend!")
    }
    return await tauri.invoke("farming", { path, rewardAddress, plotSize })
  }

  /* MNEMONIC displayed only FIRST LOAD on SaveKeys Modal. */
  public getMnemonic(): string {
    return this.mnemonic
  }
  public clearMnemonic(): void {
    this.mnemonic = ""
  }
}
