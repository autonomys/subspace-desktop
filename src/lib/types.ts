import { Vec } from '@polkadot/types/codec'
import { PeerInfo } from '@polkadot/types/interfaces/system'
import mitt, { Emitter } from 'mitt'
import { ApexOptions } from "apexcharts"

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

export interface NetStatus { peers: Vec<PeerInfo> }

export interface PeerData {
  status: 'disconnected' | 'unstable' | 'connected' | string
  name: string // do peers have some string identifier?
  ip: string
  receivedBytes: number
  sentBytes: number
}

export interface ClientNetwork {
  status: 'disconnected' | 'unstable' | 'connected' | string
  peers: PeerData[]
  details: {
    // physical network interface
    // more granular connection information here
  }
}

export interface ClientPlot {
  status: 'active' | 'verifying' | 'corrupted' | 'syncing' | string
  plotSizeGB: number // size of the plot file in GigaBytes
  plotFile: string // drive directory where the plot file is located
  details: {
    // additional information could be placed here
  }
}

export interface Block {
  id: string
  time: Date
  transactions: string[]
  reward: number
  fees: number
}

export interface ClientFarming {
  status: 'active' | 'paused' | string
  farmed: FarmedBlock[],
  events: Emitter<any>
}

export interface ClientData {
  plot: ClientPlot
  network: ClientNetwork
  farming: ClientFarming
}

export interface ClientIdentity {
  publicKey: string,
  mnemonic: string
}

export const emptyClientData: ClientData = {
  plot: { details: {}, plotFile: '', plotSizeGB: 0, status: ''},
  farming: { farmed: [], status: '', events: mitt() },
  network: { details: {}, peers: [], status: '' }
}

export const chartOptions: ApexOptions = {
  legend: { show: false },
  colors: ["#E0E0E0", "#FFFFFF", "#2081F0"],
  plotOptions: {
    pie: {
      startAngle: 0,
      endAngle: 360,
      expandOnClick: false,
      donut: { size: "40px" }
    }
  },
  dataLabels: { enabled: false },
  labels: [],
  states: {
    active: { filter: { type: "none" } },
    hover: { filter: { type: "none" } }
  },
  markers: { hover: { size: 0 } },
  tooltip: { enabled: false }
}

export type ChartDataType = number[]

export interface StatsType {
  totalDiskSizeGB: number
  safeAvailableGB: number
  utilizedGB: number
  freeGB: number
}
