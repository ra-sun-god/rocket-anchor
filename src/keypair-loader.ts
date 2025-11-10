/**
 * @project Anchor Rocket (RA)
 * @file keypair-loader.ts
 * @description Keypair loading utilities for RocketAnchor. Supports loading
 * keypairs from file paths, base58 strings, and resolving ~ paths.
 * 
 * @author Ra <ra@maxxpainn.com>
 * @created 2025-11-10
 * 
 * License: MIT
 */

import { Keypair } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import bs58 from 'bs58';

export async function loadKeypair(keyPath?: string): Promise<Keypair> {
  if (!keyPath) {
    keyPath = path.join(os.homedir(), '.config', 'solana', 'id.json');
  }

  if (keyPath.startsWith('~')) {
    keyPath = path.join(os.homedir(), keyPath.slice(1));
  }

  if (!path.isAbsolute(keyPath)) {
    keyPath = path.resolve(process.cwd(), keyPath);
  }

  if (fs.existsSync(keyPath)) {
    try {
      const keypairData = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));
      
      if (Array.isArray(keypairData)) {
        return Keypair.fromSecretKey(Uint8Array.from(keypairData));
      } else if (keypairData.secretKey) {
        return Keypair.fromSecretKey(Uint8Array.from(keypairData.secretKey));
      }
      
      throw new Error('Invalid keypair file format');
    } catch (error) {
      throw new Error(`Failed to load keypair from ${keyPath}: ${error}`);
    }
  }

  if (keyPath.length >= 32) {
    try {
      const decoded = bs58.decode(keyPath);
      return Keypair.fromSecretKey(decoded);
    } catch (error) {
      // Not a valid base58 string
    }
  }

  throw new Error(`Keypair file not found: ${keyPath}`);
}
