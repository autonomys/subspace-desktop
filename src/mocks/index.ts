import * as fs from '@tauri-apps/api/fs';

import FarmedBlockMock from './FarmedBlock.json';
import { IClient } from '../lib/client';
import { IUtil } from '../lib/util/util';
import Config,  { emptyConfig } from '../lib/config';

export { FarmedBlockMock };

export const appName = 'random app name';
export const appDir = '/random-folder/';
export const nodeName = 'random node name';

export const configFileMock = {
  ...emptyConfig,
  rewardAddress: 'random reward address',
  nodeName,
  plot: {
    location: `${appDir}${appName}`,
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
} as unknown as IClient;

export const utilMock = {
  errorLogger: jest.fn(),
  infoLogger: jest.fn(),
  generateNodeName: jest.fn(() => 'random generated name'),
} as unknown as IUtil;

export const tauriFsMock = {
  removeDir: jest.fn(),
  createDir: jest.fn().mockResolvedValue({}),
  removeFile: jest.fn(),
  readTextFile: jest.fn().mockResolvedValue(JSON.stringify(configFileMock)),
  writeFile: jest.fn().mockResolvedValue({}),
  readDir: jest.fn().mockResolvedValue('/random-dir/'),
} as unknown as typeof fs;
