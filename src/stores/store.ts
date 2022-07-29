import { defineStore } from 'pinia';

import { SyncState, FarmedBlock } from '../lib/types';
import { IClient } from '../lib/client';
import { IUtil, getErrorMessage } from "../lib/util/util";
import { IConfig } from "../lib/appConfig";
import { IBlockStorage } from '../lib/blockStorage';

export type Status = 'idle' | 'startingNode' | 'syncing' | 'farming';

interface Error {
  title: string;
  message?: string;
}

interface Network {
  peers: number;
  syncedAtNum: number;
  state: string;
  message: string;
}

interface Plot {
  state: string;
  message: string;
}

interface Plotting {
  finishedGB: number;
  remainingGB: number;
  status: string;
}

interface State {
  status: Status;
  plotSizeGB: number;
  plotDir: string;
  farmedBlocks: FarmedBlock[];
  nodeName: string;
  syncState: SyncState;
  rewardAddress: string;
  isFirstLoad: boolean;
  network: Network;
  plot: Plot;
  plotting: Plotting;
  error: Error;
}

// constants are also used in unit tests
export const INITIAL_STATUS = 'idle';
export const INITIAL_PLOT_SIZE = 1;
export const INITIAL_PLOT_DIR = '/';
export const INITIAL_SYNC_STATE = {
  currentBlock: 0,
  startingBlock: 0,
  highestBlock: 0,
}

export const useStore = defineStore('store', {
  state: (): State => ({
    status: INITIAL_STATUS,
    plotSizeGB: INITIAL_PLOT_SIZE,
    plotDir: INITIAL_PLOT_DIR,
    farmedBlocks: [],
    nodeName: '',
    syncState: INITIAL_SYNC_STATE,
    network: {
      syncedAtNum: 0,
      peers: 0,
      // TODO: consider removing network.state - probably can depend on the app statuses: 
      // 'idle' | 'startingNode' | 'syncing' | 'farming'
      state: 'starting',
      message: 'dashboard.initializing',
    },
    rewardAddress: '',
    // TODO: it is confusing to start with 'false' value, replace with better mechanism
    isFirstLoad: false,
    // plot is displayed on Dashboard
    plot: {
      state: 'starting',
      message: 'dashboard.initializing',
    },
    // plotting is displayed on PlottingProgress
    plotting: {
      finishedGB: 0,
      remainingGB: 0,
      status: 'plottingProgress.fetchingPlot',
    },
    error: {
      title: '',
      message: '',
    },
  }),

  getters: {
    trimmedName(): string {
      return this.nodeName.length > 20
        ? `${this.nodeName.slice(0, 20)}...`
        : this.nodeName;
    },
    blocksByAddress(state): FarmedBlock[] {
      return this.farmedBlocks
        .filter(({ rewardAddr }: FarmedBlock) => rewardAddr === state.rewardAddress)
    },
    // TODO: include voting rewards
    totalEarned(): string {
      return this.blocksByAddress
        .reduce((agg: number, { blockReward, feeReward }) => blockReward + feeReward + agg, 0)
        .toFixed(2)
    },
    plottingFinished(): number {
      return parseFloat(this.plotting.finishedGB.toFixed(2))
    },
    plottingRemaining(): number {
      return parseFloat((this.plotSizeGB - this.plotting.finishedGB).toFixed(2))
    },
    // returned object is consumed by $t() from vue-i18n
    plottingStatus(): { string: string, values: Record<string, number> } {
      const { currentBlock, highestBlock } = this.syncState;
      return {
        string: this.plotting.status,
        values: {
          currentBlock,
          highestBlock,
        }
      }
    },
    // returned object is consumed by $t() from vue-i18n
    networkMessage(): { string: string, values: Record<string, number> } {
      const { currentBlock, highestBlock } = this.syncState;
      const { message, syncedAtNum } = this.network;
      return {
        string: message,
        values: {
          currentBlock,
          highestBlock,
          syncedAtNum,
        }
      }
    },
  },

  // unfortunately Pinia currently does not allow DI, so it is necessary to provide client, util and blockStorage as parameters in order to make store testable
  // TODO: find more elegant solution
  actions: {
    setError(error: Error) {
      this.error = error;
    },
    setPlotDir(dir: string) {
      this.plotDir = dir;
    },
    setPlotSize(size: number) {
      this.plotSizeGB = size;
    },
    async setNodeName(config: IConfig, name: string) {
      try {
        this.nodeName = name;
        await config.update({ nodeName: name });
      } catch (error) {
        this.setError({
          title: 'errorModal.configUpdateFailed',
          message: getErrorMessage(error),
        })
      }
    },
    setSyncState(state: SyncState) {
      this.syncState = state;
    },
    setPeers(peers: number) {
      this.network.peers = peers;
    },
    setStatus(status: Status) {
      this.status = status;
    },
    async confirmPlottingSetup(config: IConfig, util: IUtil) {
      try {
        const nodeName = util.generateNodeName();
        this.setNodeName(config, nodeName);

        await config.update({
          rewardAddress: this.rewardAddress,
          plot: {
            location: this.plotDir,
            sizeGB: this.plotSizeGB,
          },
          nodeName,
        });
      } catch (error) {
        this.setError({
          title: 'errorModal.configUpdateFailed',
          message: getErrorMessage(error),
        })
      }
    },
    setRewardAddress(address: string) {
      this.rewardAddress = address;
    },
    setFirstLoad() {
      this.isFirstLoad = true;
    },
    addFarmedBlock(blockStorage: IBlockStorage, block: FarmedBlock) {
      this.farmedBlocks = [block, ...this.farmedBlocks];
      blockStorage.storeBlocks(this.farmedBlocks);
    },
    updateBlockNum(blockNum: number) {
      this.network.syncedAtNum = blockNum;
    },
    async updateFromConfig(blockStorage: IBlockStorage, config: IConfig) {
      try {
        const { plot, nodeName, rewardAddress } = await config.read();
        this.plotSizeGB = plot.sizeGB;
        this.plotDir = plot.location;
        this.nodeName = nodeName;
        this.rewardAddress = rewardAddress;
        this.farmedBlocks = blockStorage.getStoredBlocks();
      } catch (error) {
        this.setError({
          title: 'errorModal.configReadFailed',
          message: getErrorMessage(error),
        })
      }
    },
    setNetworkState(state: string) {
      this.network.state = state;
    },
    setNetworkMessage(message: string) {
      this.network.message = message;
    },
    setPlotState(state: string) {
      this.plot.state = state;
    },
    setPlotMessage(message: string) {
      this.plot.message = message;
    },
    async startNode(client: IClient, util: IUtil) {
      try {
        if (this.nodeName && this.plotDir) {
          this.setStatus('startingNode');
          await client.startNode(this.plotDir, this.nodeName);
        } else {
          // TODO: consider moving logging to client.ts
          util.errorLogger("NODE START | node name and plot directory are required to start node");
          
          this.setError({
            title: 'errorModal.startNodeFailed',
            message: 'errorModal.startNodeMissingParams',
          })
        }
      } catch (error) {
        // TODO: consider moving logging to client.ts
        util.errorLogger("NODE START | failed to start node");

        this.setError({
          title: 'errorModal.startNodeFailed',
          message: getErrorMessage(error),
        })
      }
    },
    async startFarmer(client: IClient, util: IUtil, blockStorage: IBlockStorage) {
      try {
        this.setStatus('syncing');
        // TODO: consider refactoring statuses after Dashboard Plot component #294 is resolved
        this.setNetworkState('verifying');
        this.setPlotMessage('dashboard.verifyingPlot');
        this.setNetworkMessage('dashboard.verifyingNet');

        const farmerStarted = await client.startFarming(this.plotDir, this.plotSizeGB);
        if (!farmerStarted) {
          // TODO: consider moving logging to client.ts
          util.errorLogger("PLOTTING PROGRESS | Farmer start error!")
        }
        // TODO: consider moving logging to client.ts
        util.infoLogger("PLOTTING PROGRESS | farmer started")

        const syncState = await client.getSyncState();
        this.setSyncState(syncState);
        let isSyncing = await client.isSyncing();

        do {
          await new Promise((resolve) => setTimeout(resolve, 3000))
          const syncState = await client.getSyncState();
          this.setSyncState(syncState);
          this.setPlotMessage('dashboard.plotActive');
          this.setNetworkMessage('dashboard.syncingMsg');
          this.setPlottingStatus('dashboard.syncingMsg');
          this.setPlottingFinished((this.syncState.currentBlock * this.plotSizeGB) / this.syncState.highestBlock);
          isSyncing = await client.isSyncing();
        } while (isSyncing);

        this.setNetworkState('finished');
        this.setNetworkMessage('dashboard.syncedAt');
        this.setPlotState('finished');
        this.setPlotMessage('dashboard.syncedMsg');
        this.setStatus('farming');

        await client.startSubscription({
          farmedBlockHandler: (block) => this.addFarmedBlock(blockStorage, block),
          newBlockHandler: this.updateBlockNum,
        });

        // TODO: consider moving logging to client.ts
        util.infoLogger("PLOTTING PROGRESS | block subscription started")
      } catch (error) {
        this.setError({
          title: 'errorModal.startFarmerFailed',
          message: getErrorMessage(error),
        })
      }
    },
    setPlottingFinished(value: number) {
      this.plotting.finishedGB = value;
    },
    setPlottingRemaining(value: number) {
      this.plotting.remainingGB = value;
    },
    setPlottingStatus(status: string) {
      this.plotting.status = status;
    }
  }
});
