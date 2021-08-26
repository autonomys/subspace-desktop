import { ApiPromise, WsProvider } from '@polkadot/api';




export interface PeerData {
  status: "disconnected" | "unstable" | "connected" | string
  name: string // do peers have some string identifier?
  ip: string
  receivedBytes: number
  sentBytes: number
}

export interface ClientNetwork {
  status: "disconnected" | "unstable" | "connected" | string
  peers: PeerData[]
  details: {
    // physical network interface
    // more granular connection information here
  }
}

export interface ClientPlot {
  status: "active" | "verifying" | "corrupted" | "syncing" | string
  plotSizeBytes: number // size of the plot file in Bytes
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
  status: "active" | "paused" | string
  farmed: Block[]
}

export interface ClientData {
  plot: ClientPlot
  network: ClientNetwork
  farming: ClientFarming
}

let data: ClientData = {
  plot: { details: {}, plotFile: "", plotSizeBytes: 0, status: "" },
  farming: { farmed: [], status: "" },
  network: { details: {}, peers: [], status: "" }
}

export interface Client {
  api: ApiPromise | null
  data: ClientData
  getStatus: {
    farming: Function
    plot: Function
    network: Function
  },
  do?: any
}
export type ClientType = Client | null


export const Client = async () => {
  const wsProvider = new WsProvider();
  const api = await ApiPromise.create({ provider: wsProvider });
  console.log(api.genesisHash.toHex());
  console.log('init client...');
  const client = <Client>{
    api,
    data,
    getStatus: {
      async farming() { client.data.farming = await getFarmingData() },
      async plot() { client.data.plot = await getPlotData() },
      async network() { client.data.network = await getNetworkData() }
    },
    do: {
      // startPlotting()
      // stopPlotting()
      // startFarming()
      // stopFarming()
      // restartClient()
      // stopClient()
      // startClient()
    }
  }
  return client
}



async function getFarmingData() {
  return data.farming
}
async function getPlotData() {
  return data.plot
}
async function getNetworkData() {
  return data.network
}
