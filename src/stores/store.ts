import { defineStore } from 'pinia';
import pRetry, { FailedAttemptError } from 'p-retry';

import { SyncState, FarmedBlock } from '../lib/types';
import { Client } from '../lib/client';
import Config from '../lib/config';
import { IBlockStorage } from '../lib/blockStorage';
import TauriInvoker from '../lib/tauri';

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
  plotPath: string;
  farmedBlocks: FarmedBlock[];
  nodeName: string;
  syncState: SyncState;
  rewardAddress: string;
  isFirstLoad: boolean;
  network: Network;
  plot: Plot;
  plotting: Plotting;
  error: Error;
  hasNewUpdate: boolean;
}

// constants are also used in unit tests
export const INITIAL_STATUS = 'idle';
export const INITIAL_PLOT_SIZE = 1;
export const INITIAL_PLOT_DIR = '/';
export const INITIAL_SYNC_STATE = {
  currentBlock: 0,
  startingBlock: 0,
  highestBlock: 0,
};

export const useStore = defineStore('store', {
  state: (): State => ({
    status: INITIAL_STATUS,
    plotSizeGB: INITIAL_PLOT_SIZE,
    plotPath: INITIAL_PLOT_DIR,
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
    hasNewUpdate: false,
  }),

  getters: {
    /**
     * Get trimmed node name so it won't break header layout
     */
    trimmedName(): string {
      return this.nodeName.length > 20
        ? `${this.nodeName.slice(0, 20)}...`
        : this.nodeName;
    },
    /**
     * Get farmed blocks by current user address.
     * We have to filter, because block storage may contain blocks farmed by different reward address in case user has updated config manully
     */
    blocksByAddress(state): FarmedBlock[] {
      return this.farmedBlocks
        .filter(({ rewardAddr }: FarmedBlock) => rewardAddr === state.rewardAddress);
    },
    // TODO: include voting rewards
    /**
     * Total reward for current reward address
     */
    totalEarned(): string {
      return this.blocksByAddress
        .reduce((agg: number, { blockReward, feeReward }) => blockReward + feeReward + agg, 0)
        .toFixed(2);
    },
    plottingFinished(): number {
      return parseFloat(this.plotting.finishedGB.toFixed(2));
    },
    plottingRemaining(): number {
      return parseFloat((this.plotSizeGB - this.plotting.finishedGB).toFixed(2));
    },
    /**
     * Get plotting status as an object, which is consumed by $t() from vue-i18n and returns localised string
     * Used on Dashboard screen
     */
    plottingStatus(): { string: string, values: Record<string, number> } {
      const { currentBlock, highestBlock } = this.syncState;
      return {
        string: this.plotting.status,
        values: {
          currentBlock,
          highestBlock,
        }
      };
    },
    /**
     * Get network message as an object, which is consumed by $t() from vue-i18n and returns localised string
     * Used on Dashboard screen
     */
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
      };
    },
  },

  // unfortunately Pinia currently does not allow DI, so it is necessary to provide client, util and blockStorage as parameters in order to make store testable
  // TODO: find more elegant solution
  actions: {
    setError(error: Error) {
      this.error = error;
    },
    setPlotPath(path: string) {
      this.plotPath = path;
    },
    setPlotSize(size: number) {
      this.plotSizeGB = size;
    },
    /**
     * Set node name value in store and config file.
     * Update store 'error' property in case of failure
     * @param {Config} config - instance of Config class
     * @param {string} name - node name (generated or provided by user)
     */
    async setNodeName(config: Config, name: string) {
      try {
        this.nodeName = name;
        await config.update({ nodeName: name });
      } catch (error) {
        this.setError({
          title: 'errorPage.configUpdateFailed',
          // TODO: replace default error message with specific one
          message: 'errorPage.defaultErrorMessage',
        });
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
    /**
     * Generate node name and save plot setup to config file
     * Update store 'error' property in case of failure
     * @param {Config} config - instance of Config class
     * @param {string} nodeName - generated node name
     */
    async confirmPlottingSetup(config: Config, nodeName: string) {
      try {
        await this.setNodeName(config, nodeName);

        await config.update({
          rewardAddress: this.rewardAddress,
          plot: {
            location: this.plotPath,
            sizeGB: this.plotSizeGB,
          },
        });
      } catch (error) {
        this.setError({
          title: 'errorPage.configUpdateFailed',
          // TODO: replace default error message with specific one
          message: 'errorPage.defaultErrorMessage',
        });
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
    /**
     * Populate store with values from config file on app restart
     * Update store 'error' property in case of failure
     * @param {IBlockStorage} blockStorage - local storage where farmed blocks are saved
     * @param {Config} config - instance of Config class
     */
    async updateFromConfig(blockStorage: IBlockStorage, config: Config) {
      try {
        const { plot, nodeName, rewardAddress } = await config.readConfigFile();
        this.plotSizeGB = plot.sizeGB;
        this.plotPath = plot.location;
        this.nodeName = nodeName;
        this.rewardAddress = rewardAddress;
        this.farmedBlocks = blockStorage.getStoredBlocks();
      } catch (error) {
        this.setError({
          title: 'errorPage.configReadFailed',
          // TODO: replace default error message with specific one
          message: 'errorPage.defaultErrorMessage',
        });
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
    /**
     * Start node and update app status
     * Update store 'error' property in case of failure
     * @param {Client} client - instance of Client class
     * @param {TauriInvoker} tauri - tauri invoker
     */
    async startNode(client: Client, tauri: TauriInvoker) {
      try {
        if (this.nodeName && this.plotPath) {
          this.setStatus('startingNode');
          await client.startNode(this.plotPath, this.nodeName);
          // TODO: move back to startFarmer method below after restart workaround is removed (loop is replaced by subscription)
          this.setStatus('syncing');
        } else {
          tauri.errorLogger('NODE START | node name and plot directory are required to start node');

          this.setError({
            title: 'errorPage.startNodeFailed',
            // TODO: replace default error message with specific one
            message: 'errorPage.defaultErrorMessage',
          });
        }
      } catch (error) {
        tauri.errorLogger('NODE START | failed to start node');

        this.setError({
          title: 'errorPage.startNodeFailed',
          // TODO: replace default error message with specific one
          message: 'errorPage.defaultErrorMessage',
        });
      }
    },
    /**
     * Start farmer and update app status along the way:
     * First 'syncing', then 'farming'
     * Update store 'error' property in case of failure
     * @param {Client} client - instance of Client class
     * @param {TauriInvoker} tauri - tauri invoker
     * @param {IBlockStorage} blockStorage - local storage where farmed blocks are saved
     */
    async startFarmer(client: Client, tauri: TauriInvoker, blockStorage: IBlockStorage) {
      try {
        // TODO: consider refactoring statuses after Dashboard Plot component #294 is resolved
        this.setNetworkState('verifying');
        this.setPlotMessage('dashboard.verifyingPlot');
        this.setNetworkMessage('dashboard.verifyingNet');

        await client.startFarming(this.plotPath, this.plotSizeGB);
        tauri.infoLogger('farmer started');

        const syncState = await client.getSyncState();
        this.setSyncState(syncState);
        let isSyncing;

        do {
          await new Promise((resolve) => setTimeout(resolve, 3000));
          // using pRetry as a workaround,
          // because loop will keep executing in case of node restart,
          // API requests will fail, because RPC is not available until node has restarted
          // TODO: replace do-while loop with subscription, which can be terminated before restarting node
          const syncState = await pRetry(() => client.getSyncState(), {
            onFailedAttempt(error: FailedAttemptError) {
              console.log(`store.startFarmer: inside loop client.getSyncState retry error. Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`);
            },
          });

          this.setSyncState(syncState);
          this.setPlotMessage('dashboard.plotActive');
          this.setNetworkMessage('dashboard.syncingMsg');
          this.setPlottingStatus('dashboard.syncingMsg');
          // adding 1 as fallback, because syncState.currentBlock and syncState.highestBlock can be 0, which may result in NaN
          const finishedGB = ((this.syncState.currentBlock || 1) * this.plotSizeGB) / (this.syncState.highestBlock || 1);
          this.setPlottingFinished(finishedGB);
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

        tauri.infoLogger('block subscription started');
      } catch (error) {
        tauri.errorLogger('Farmer start error: ' + error as string);
        this.setError({
          title: 'errorPage.startFarmerFailed',
          // TODO: replace default error message with specific one
          message: 'errorPage.defaultErrorMessage',
        });
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
    },
    setHasNewUpdate() {
      this.hasNewUpdate = true;
    }
  }
});
