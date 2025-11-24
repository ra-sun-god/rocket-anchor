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

export const retryExecute = async <T>(
  func: () => Promise<T>,
  retries: number
): Promise<T | null> => {

  for (let i = 0; i < retries; i++) {
    try {
      // Force timeout (Solana RPC often hangs)
      const result: any = await Promise.race([
        func(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("RPC timeout")), 8000)
        ),
      ]);

      // Solana returns null when account doesn't exist — treat as error
      if (result === null || result === undefined) {
        throw new Error("RPC returned null");
      }

      return result as T;

    } catch (e) {
      const waitTime = Math.max(1, i * 2);
      console.log(`Retry ${i + 1} failed → ${(e as Error).message}`);
      console.log(`Waiting ${waitTime}s before retry...\n`);
      await new Promise((r) => setTimeout(r, waitTime * 1000));
    }
  }

  return null;
};
