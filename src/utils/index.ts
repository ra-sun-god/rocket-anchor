/**
 * @project Anchor Rocket (RA)
 * @file index.ts
 * @description Main entry point for the RocketAnchor deployment toolkit.
 * Provides methods to load configuration, deploy programs, and run seed scripts.
 * 
 * @author Ra <ra@maxxpainn.com>
 * @created 2025-11-10
 * 
 * License: MIT
 */

import { PublicKey } from "@solana/web3.js";

export function isValidPublicKey(str: string) {
  try {
    new PublicKey(str); // throws if invalid
    return true;
  } catch (e) {
    return false;
  }
}

export const isBN = (value: any) => {
    return (
        typeof value === 'object' &&
        typeof value.toNumber === 'function' &&
        typeof value.toArrayLike === "function" &&
        typeof value.toTwos === "function" &&
        typeof value.add === "function"
    )
}

export const delay = (timeMs: number) => {
    return new Promise((resolve, reject)=>{
        setTimeout(()=> { resolve(true) }, timeMs)
    })
}