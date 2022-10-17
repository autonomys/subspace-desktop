import { LocalStorage } from 'quasar';
import { FarmedBlock } from '../lib/types';

export interface IBlockStorage {
  getStoredBlocks: () => FarmedBlock[];
  storeBlocks: (blocks: FarmedBlock[]) => void;
}

export function getStoredBlocks(): FarmedBlock[] {
  const mined: FarmedBlock[] = [];
  const blocks = LocalStorage.getItem('farmedBlocks');
  if (!blocks) return [];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const [num, block] of Object.entries(blocks)) {
    mined.push(block as FarmedBlock);
  }

  return mined;
}

export function storeBlocks(blocks: FarmedBlock[]): void {
  const farmed: { [index: string]: FarmedBlock } = {};
  for (const block of blocks) {
    farmed[block.id] = block;
  }
  LocalStorage.set('farmedBlocks', farmed);
}
