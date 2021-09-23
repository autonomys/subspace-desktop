import { AccountId } from '@polkadot/types/interfaces/runtime'
import type { Bytes, Struct, U8aFixed, u64 } from '@polkadot/types'

export interface FarmerId extends AccountId { }

export interface Solution extends Struct {
  readonly public_key: FarmerId;
  readonly nonce: u64;
  readonly encoding: Bytes;
  readonly signature: Bytes;
  readonly tag: U8aFixed;
}
export interface Slot extends u64 { }

export interface PoCPreDigest extends Struct {
  readonly slot: Slot;
  readonly solution: Solution;
}

