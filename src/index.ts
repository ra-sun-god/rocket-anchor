/**
 * @project Anchor Rocket (RA)
 * @file index.ts
 * @description Main entry point for the RocketAnchor deployment toolkit.
 * Provides methods to load configuration, deploy programs, and run seed scripts.
 * 
 * @author Ra<ra@maxxpainn.com>
 * @created 2025-11-10
 * 
 * License: MIT
 */

import { DeployOptions, DeployResult, RAConfig } from './types';

export { 
  ProgramInfo, 
  DeployResult,
  SeedConfig,
  PathsConfig
} from './types';
export { loadConfig } from './config-loader';
export { deploy } from './deployer';
export { loadKeypair } from './keypair-loader';
export { runSeeds } from './seeder';

export class RocketAnchor {
  private config: RAConfig | null = null;

  async loadConfig(configPath?: string): Promise<RAConfig> {
    const { loadConfig } = await import('./config-loader');
    this.config = await loadConfig(configPath);
    return this.config;
  }

  async deploy(options: DeployOptions): Promise<DeployResult[]> {
    if (!this.config) {
      await this.loadConfig();
    }

    if (!this.config) {
      throw new Error('Configuration not loaded');
    }

    const { deploy } = await import('./deployer');
    return await deploy(this.config, options.network, options);
  }

  async seed(network: string, program?: string, seedScript?: string): Promise<void> {
    if (!this.config) {
      await this.loadConfig();
    }

    if (!this.config) {
      throw new Error('Configuration not loaded');
    }

    const { runSeeds } = await import('./seeder');
    await runSeeds(this.config, network, { program, seedScript });
  }

  getConfig(): RAConfig | null {
    return this.config;
  }
}

export default RocketAnchor;
