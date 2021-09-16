export interface FarmedBlock {
  blockNum: number
  time: number
  transactions: number
  blockReward: number
  feeReward: number
  id: string
}

export interface AutoLaunchParams { appName: string, appPath: string, hidden: boolean }
