/**
 * @project Anchor Rocket (RA)
 * @file config-loader.ts
 * @description Configuration loader for RocketAnchor. Loads and validates
 * ra.config.ts or ra.config.js files from the project root.
 * 
 * @author Ra <ra@maxxpainn.com>
 * @created 2025-11-10
 * 
 * License: MIT
 */

import * as path from 'path';
import * as fs from 'fs';
import { RAConfig } from './types';

export async function loadConfig(configPath?: string): Promise<RAConfig> {
  const searchPaths = configPath 
    ? [configPath]
    : [
        path.join(process.cwd(), 'ra.config.ts'),
        path.join(process.cwd(), 'ra.config.js'),
      ];

  for (const searchPath of searchPaths) {
    if (fs.existsSync(searchPath)) {
      try {
        const configModule = await import(searchPath);
        const config = configModule.default || configModule;
        validateConfig(config);
        return config;
      } catch (error) {
        throw new Error(`Failed to load config from ${searchPath}: ${error}`);
      }
    }
  }

  throw new Error('ra.config.ts or ra.config.js not found. Run "ra init" to create one.');
}

function validateConfig(config: any): asserts config is RAConfig {
  if (!config.networks || typeof config.networks !== 'object') {
    throw new Error('Config must have a "networks" object');
  }

  for (const [name, network] of Object.entries(config.networks)) {
    if (typeof network !== 'object' || !network) {
      throw new Error(`Network "${name}" must be an object`);
    }
    
    const net = network as any;
    if (!net.url || typeof net.url !== 'string') {
      throw new Error(`Network "${name}" must have a valid "url" string`);
    }
  }
}
