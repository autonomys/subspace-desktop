import FarmedBlockMock from './FarmedBlock.json';
import { IClient } from '../lib/client';
import { IUtil } from '../lib/util';
import { IConfig } from '../lib/appConfig';

export {
  FarmedBlockMock,
  configMockData,
};

const configMockData = {
  plot: {
    location: "/random_location",
    sizeGB: 100
  },
  rewardAddress: "random address",
  nodeName: "random node name",
}

export const configMock = {
  configDir: jest.fn(),
  configFullPath: jest.fn(),
  init: jest.fn(),
  validate: jest.fn(),
  remove: jest.fn(),
  read: jest.fn(() => Promise.resolve(configMockData)),
  write: jest.fn(),
  update: jest.fn(),
  showErrorModal: jest.fn(),
} as unknown as IConfig

export const blockStorageMock = {
  getStoredBlocks: jest.fn(),
  storeBlocks: jest.fn(),
}

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
} as unknown as IClient;

export const utilMock = {
  errorLogger: jest.fn(),
  infoLogger: jest.fn(),
  generateNodeName: jest.fn(() => 'random generated name'),
} as unknown as IUtil
