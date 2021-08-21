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


export const client = {
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



async function getFarmingData() {
  return data.farming
}
async function getPlotData() {
  return data.plot
}
async function getNetworkData() {
  return data.network
}