import FarmedBlockMock from './FarmedBlock.json';
import { Client } from '../lib/client';
import Config,  { emptyConfig } from '../lib/config';
import TauriInvoker from '../lib/tauri';

export { FarmedBlockMock };

export const appName = 'random app name';
export const configDir = '/random-folder/';
export const nodeName = 'random node name';

export const configFileMock = {
  ...emptyConfig,
  rewardAddress: 'random reward address',
  nodeName,
  plot: {
    location: `${configDir}${appName}`,
    sizeGB: 10,
  }
};

export const configClassMock = {
  configDir: '/random-dir/',
  configFullPath: '/this-is-full-path/to/config-file.cfg',
  init: jest.fn(),
  validate: jest.fn(),
  remove: jest.fn(),
  readConfigFile: jest.fn(() => Promise.resolve(configFileMock)),
  write: jest.fn(),
  update: jest.fn(),
  showErrorModal: jest.fn(),
} as unknown as Config;

export const blockStorageMock = {
  getStoredBlocks: jest.fn(),
  storeBlocks: jest.fn(),
};

export const clientMock = {
  startNode: jest.fn(),
  startFarming: jest.fn(),
  getSyncState: jest.fn(() => ({
    currentBlock: 10,
    startingBlock: 0,
    highestBlock: 1000,
  })),
  isSyncing: jest.fn(() => false),
  startSubscription: jest.fn(),
} as unknown as Client;

export const tauriInvokerMock = new TauriInvoker(jest.fn().mockResolvedValue({}));
