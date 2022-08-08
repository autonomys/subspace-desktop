import * as fs from '@tauri-apps/api/fs';

import Config from './config';
import { errorLogger } from './util';

export interface IPlotDir {
  removePlot: (config: Config) => Promise<void>;
  createPlotDir: (location: string) => Promise<void>;
}

// TODO: consider merging these with Config into one class that interacts with file system
// TODO: just provide plot location string instead of config
/**
 * Utility function to remove plot from file system, used when user wants to reset the app
 * @param {Config} config 
 */
export async function removePlot(config: Config): Promise<void> {
  const { plot } = await config.readConfigFile();
  if (plot.location === '') return;

  await fs.removeDir(plot.location, { recursive: true }).catch((error) => {
    errorLogger(error);
  });
}

/**
 * Utility function to create plot directory when setting up application
 * @param {string} location - plot location
 */
export async function createPlotDir(location: string): Promise<void> {
  await fs.createDir(location).catch((error) => {
    errorLogger(error);
  });
}


