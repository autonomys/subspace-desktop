import type { AccountId32 } from '@polkadot/types/interfaces';
import type { Struct, u64 } from '@polkadot/types';

export interface FarmedBlock {
  blockNum: number
  time: number
  transactions: number
  blockReward: number
  feeReward: number
  id: string
  rewardAddr: string
}

export interface AutoLaunchParams {
  appName: string
  appPath: string
  minimized: boolean
}

export interface ChildReturnData {
  stdout: string[]
  stderr: string[]
}

export interface Block {
  id: string
  time: Date
  transactions: string[]
  reward: number
  fees: number
}

export type ChartDataType = number[]

export interface StatsType {
  totalDiskSizeGB: number
  safeAvailableGB: number
  utilizedGB: number
  freeGB: number
}

interface Solution extends Struct {
  readonly public_key: AccountId32
  readonly reward_address: AccountId32;
}

export interface SubPreDigest extends Struct {
  readonly slot: u64
  readonly solution: Solution
}

export interface SyncState {
  startingBlock: number;
  currentBlock: number;
  highestBlock: number;
}
