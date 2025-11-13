/**
 * @project Anchor Rocket (RA)
 * @file cli.ts
 * @description Command-line interface for RocketAnchor. Provides CLI commands
 * for deployment, seeding, building, testing, and initialization.
 * 
 * @author Ra <ra@maxxpainn.com>
 * @created 2025-11-10
 * 
 * License: MIT
 */

import { Command } from 'commander';
import { deploy } from './deployer';
import { loadConfig } from './config-loader';
import { runSeeds } from './seeder';
import { DeployOptions } from './types';
import { createLogger } from './utils/logger';

const logger = createLogger();
const program = new Command();

program
  .name('ra')
  .description('🚀 Rocket Anchor - Hardhat-style deployment for Solana Anchor')
  .version('1.0.0');

program
  .command('deploy')
  .description('Deploy Anchor programs to specified network')
  .requiredOption('-n, --network <network>', 'Network to deploy to')
  .option('-p, --program <program>', 'Specific program to deploy')
  .option('--skip-build', 'Skip building programs', false)
  .option('--verify', 'Verify deployment after completion', false)
  .option('--upgradeable', 'Deploy as upgradeable program', true)
  .option('--program-id <programId>', 'Use specific program ID')
  .option('--seed', 'Run seed/initialize scripts after deployment', false)
  .option('--seed-script <path>', 'Path to custom seed script')
  .action(async (options: DeployOptions) => {
    try {
      logger.header('Rocket Anchor Deployment');
      
      const config = await loadConfig();
      
      if (!config.networks[options.network]) {
        logger.error(`Network "${options.network}" not found in ra.config.ts`);
        logger.info('Available networks:', Object.keys(config.networks).join(', '));
        process.exit(1);
      }

      const results = await deploy(config, options.network, options);
      
      logger.success('\nDeployment Summary:');
      results.forEach(result => {
        if (result.success) {
          logger.success(`✓ ${result.programName}: ${result.programId}`);
        } else {
          logger.error(`✗ ${result.programName}: ${result.error}`);
        }
      });

      const allSuccess = results.every(r => r.success);
      if (allSuccess) {
        logger.success('\n🎉 All deployments completed successfully!');
      } else {
        logger.error('\n⚠️  Some deployments failed');
        process.exit(1);
      }
    } catch (error) {
      logger.error('\n❌ Deployment failed:', error);
      process.exit(1);
    }
  });

program
  .command('seed')
  .description('Run seed/initialize scripts for deployed programs')
  .requiredOption('-n, --network <network>', 'Network to seed on')
  .option('-p, --program <program>', 'Specific program to seed')
  .option('-s, --script <path>', 'Path to custom seed script')
  .action(async (options) => {
    try {
      logger.header('Seeding Programs');
      
      const config = await loadConfig();
      
      if (!config.networks[options.network]) {
        logger.error(`Network "${options.network}" not found in ra.config.ts`);
        process.exit(1);
      }

      await runSeeds(config, options.network, {
        program: options.program,
        seedScript: options.script,
      });
      
      logger.success('\n✅ Seeding completed successfully!');
    } catch (error) {
      logger.error('\n❌ Seeding failed:', error);
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize ra.config.ts in current directory')
  .action(async () => {
    const fs = await import('fs');
    const path = await import('path');
    
    const configTemplate = `import type { RAConfig } from 'rocket-anchor';

const config: RAConfig = {
  networks: {
    solana_localnet: {
      url: 'http://127.0.0.1:8899',
      accounts: ['~/.config/solana/id.json'],
      commitment: 'confirmed',
      type: 'localnet'
    },
    solana_devnet: {
      url: 'https://api.devnet.solana.com',
      accounts: ['~/.config/solana/devnet.json'],
      commitment: 'confirmed',
      timeout: 60000,
      type: 'devnet'
    },
    solana_mainnet: {
      url: 'https://api.mainnet-beta.solana.com',
      accounts: ['~/.config/solana/mainnet.json'],
      commitment: 'finalized',
      timeout: 90000,
      type: 'mainnet'
    },
  },
  paths: {
    programs: './programs',
    tests: './tests',
    artifacts: './target',
  },
};

export default config;
`;

    const configPath = path.join(process.cwd(), 'ra.config.ts');
    
    if (fs.existsSync(configPath)) {
      logger.error('ra.config.ts already exists!');
      process.exit(1);
    }

    fs.writeFileSync(configPath, configTemplate);
    logger.success('✅ Created ra.config.ts');
  });

program
  .command('build')
  .description('Build Anchor programs')
  .option('--verifiable', 'Build with verifiable flag', false)
  .action(async (options) => {
    const { execSync } = await import('child_process');
    logger.info('📦 Building Anchor programs...');
    
    try {
      const cmd = options.verifiable ? 'anchor build --verifiable' : 'anchor build';
      execSync(cmd, { stdio: 'inherit' });
      logger.success('✅ Build completed');
    } catch (error) {
      logger.error('Build failed:', error);
      process.exit(1);
    }
  });

program
  .command('test')
  .description('Run tests')
  .option('-n, --network <network>', 'Network to run tests on', 'localnet')
  .action(async (options) => {
    logger.info(`🧪 Running tests on ${options.network}...`);
    const { execSync } = await import('child_process');
    
    try {
      execSync('anchor test', { stdio: 'inherit' });
      logger.success('✅ Tests passed');
    } catch (error) {
      logger.error('Tests failed:', error);
      process.exit(1);
    }
  });

program.parse();
