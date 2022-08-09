import { Dialog, DialogChainObject } from 'quasar';
import { Component } from 'vue';
import * as process from 'process';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { generateSlug } from 'random-word-slugs';

export interface IUtil {
  generateNodeName: () => string;
  errorLogger: (str: string) => Promise<void>;
  infoLogger: (str: string) => Promise<void>;
}

const nodeNameMaxLength = 64;

/**
 * Utility function to open modal using Quasar Dialog API
 * @param {Component} component - Vue component representing modal, for example mnemonicModal.vue
 * @param {object} props - optional component params
 * @returns {DialogChainObject} - chainable object with methods that accept callbacks (onOk, onDismiss, etc.)
 */
export async function showModal(
  component: Component,
  props: any = {}
): Promise<DialogChainObject> {
  return Dialog.create({
    component,
    componentProps: {
      ...props
    }
  });
}

// TODO: rethink about the signature of this function, it should be string instead, and refactor the codebase accordingly
export function toFixed(num: number, precision: number): number {
  if (!num) return 0;
  return parseFloat(num.toFixed(precision));
}

/**
 * Utility function to format time in HH:MM:SS format
 * @param {number} duration - time in milliseconds
 * @returns {string} - string representing time in HH:MM:SS format
 */
export function formatMS(duration: number): string {
  duration /= 1000;
  // Hours, minutes and seconds
  const hrs = ~~(duration / 3600);
  const mins = ~~((duration % 3600) / 60);
  const secs = ~~duration % 60;

  // Output like "1:01" or "4:03:59" or "123:03:59"
  let ret = '';

  if (hrs > 0) {
    ret += '' + hrs + ':' + (mins < 10 ? '0' : '');
  }

  ret += '' + mins + ':' + (secs < 10 ? '0' : '');
  ret += '' + secs;
  return ret;
}

const apiTypes = {
  Solution: {
    public_key: 'AccountId32',
    reward_address: 'AccountId32'
  },
  SubPreDigest: {
    slot: 'u64',
    solution: 'Solution'
  }
};

export const PIECE_SIZE = 4096;
export const GB = 1024 * 1024 * 1024;
export const CONTEXT_MENU = process.env.DEV || 'OFF'; // enables context menu only if DEV mode is on

/**
 * Utility function for creation of Polkadot.js API instance
 * @param {string | string[]} url - single or multiple RPC endpoints to connect
 * @returns {ApiPromise} - Polkadot.js API instance
 */
export function createApi(url: string | string[]): ApiPromise {
  return new ApiPromise({
    provider: new WsProvider(url, false),
    types: apiTypes,
    throwOnConnect: true,
  });
}

/**
 * Utility function to generate random name for local node name
 * @returns {string} - generated node name
 */
export function generateNodeName(): string {
  let nodeName = '';
  do {
    const slug = generateSlug(2);
    const num = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
    nodeName = slug + '-' + num.toString();
  } while (nodeName.length > nodeNameMaxLength);
  return nodeName;
}

/**
 * Utility function to get error message from error
 * @param {unknown} error - can be instance of Error object or string
 * @returns {string} - error message
 */
export function getErrorMessage(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.message;
  } else if (typeof error === 'string') {
    return error;
  } else {
    return;
  }
}
