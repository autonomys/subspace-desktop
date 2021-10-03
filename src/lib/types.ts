export interface FarmedBlock {
  author: string
  blockNum: number
  time: number
  transactions: number
  blockReward: number
  feeReward: number
  id: string
}

export interface AutoLaunchParams { appName: string, appPath: string, hidden: boolean }


export interface ChildReturnData { stdout: string[], stderr: string[] }
