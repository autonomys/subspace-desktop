import { AccountId32 } from '@polkadot/types/interfaces';
import type { Struct, u64 } from '@polkadot/types';

interface Solution extends Struct {
  readonly public_key: AccountId32;
}

export interface SubPreDigest extends Struct {
  readonly slot: u64;
  readonly solution: Solution;
}
