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