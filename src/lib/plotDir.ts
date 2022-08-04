import * as fs from '@tauri-apps/api/fs';

import Config from './config';
import { errorLogger } from './util';

export interface IPlotDir {
  removePlot: (config: Config) => Promise<void>;
  createPlotDir: (location: string) => Promise<void>;
}

// TODO: consider merging these with Config into one class that interacts with file system
export async function removePlot(config: Config): Promise<void> {
  const { plot } = await config.readConfigFile();
  if (plot.location === '') return;
  // TODO: should propagate error, so it can be handled on UI
  await fs.removeDir(plot.location, { recursive: true }).catch((error) => {
    errorLogger(error);
  });
}

export async function createPlotDir(location: string): Promise<void> {
  // TODO: should propagate error, so it can be handled on UI
  await fs.createDir(location).catch((error) => {
    errorLogger(error);
  });
}


