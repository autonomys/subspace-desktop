export interface FarmedBlock {
  author: string
  blockNum: number
  time: number
  transactions: number
  blockReward: number
  feeReward: number
  id: string
}

export interface AutoLaunchParams { appName: string, appPath: string, minimized: boolean }


export interface ChildReturnData { stdout: string[], stderr: string[] }
