/**
 * @project Anchor Rocket (RA)
 * @file deployer.ts
 * @description Deployment logic for RocketAnchor. Handles building, deploying,
 * and verifying Anchor programs to various Solana networks.
 * 
 * @author Ra <ra@maxxpainn.com>
 * @created 2025-11-10
 * 
 * License: MIT
 */

import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { execSync } from 'child_process';
import { RAConfig, DeployOptions, ProgramInfo, DeployResult } from './types';
import { loadKeypair } from './keypair-loader';
import { findPrograms } from './utils/program-finder';
import { createLogger } from './utils/logger';
import { runSeeds } from './seeder';
import path from 'path';

const logger = createLogger();

export async function deploy(
  config: RAConfig,
  networkName: string,
  options: DeployOptions
): Promise<DeployResult[]> {
  const networkConfig = config.networks[networkName];
  const results: DeployResult[] = [];
  
  logger.network(networkName, networkConfig.url);

  const connection = new Connection(networkConfig.url, {
    commitment: networkConfig.commitment || 'confirmed',
    wsEndpoint: networkConfig.websocket,
  });

  const deployer = await loadKeypair(networkConfig.accounts?.[0]);
  logger.wallet(deployer.publicKey.toBase58());

  const balance = await connection.getBalance(deployer.publicKey);
  logger.balance(balance / 1e9);

  if (balance === 0) {
    throw new Error('Deployer account has no SOL balance');
  }

  if (!options.skipBuild) {
    logger.building();
    try {
      execSync('anchor build', { stdio: 'inherit' });
      logger.success('✅ Build completed\n');
    } catch (error) {
      throw new Error('Build failed');
    }
  }

  const programs = await findPrograms(config, options.program);
  
  for (const program of programs) {
    logger.deploying(program.name);
    
    try {
      const result = await deployProgram(
        program,
        networkConfig,
        options
      );
      
      results.push(result);
      
      if (result.success) {
        logger.success(`✅ ${program.name} deployed`);
        logger.programId(result.programId);
        if (result.txSignature) {
          logger.transaction(result.txSignature);
        }
      }
    } catch (error: any) {
      const errorResult: DeployResult = {
        success: false,
        programName: program.name,
        programId: '',
        error: error.message,
      };
      results.push(errorResult);
      logger.error(`❌ Failed to deploy ${program.name}:`, error);
    }
  }

  if (options.verify) {
    logger.verifying();
    for (const result of results) {
      if (result.success) {
        await verifyProgram(connection, result);
      }
    }
  }

  if (options.seed) {
    logger.info('\n🌱 Running seed scripts...');
    await runSeeds(config, networkName,{
      program: options.program,
      seedScript: options.seedScript,
    });
  }

  return results;
}

async function deployProgram(
  program: ProgramInfo,
  networkConfig: any,
  options: DeployOptions
): Promise<DeployResult> {

  const programKeypair = await loadKeypair(program.keypairPath);
  const programId = programKeypair.publicKey.toBase58();

  const deployerKeypairPath = path.resolve(networkConfig.accounts?.[0]);

  try {
    const upgradeableFlag = options.upgradeable !== false ? '' : '--final';
    const cmd = `solana program deploy ${program.soPath} \
      --program-id ${program.keypairPath} \
      --keypair ${deployerKeypairPath} \
      --url ${networkConfig.url} ${upgradeableFlag}
    `;
    
    const output = execSync(cmd, { encoding: 'utf-8' });
    
    const txMatch = output.match(/Signature: ([A-Za-z0-9]+)/);
    const txSignature = txMatch ? txMatch[1] : undefined;

    return {
      success: true,
      programName: program.name,
      programId,
      txSignature,
    };
  } catch (error: any) {
    return {
      success: false,
      programName: program.name,
      programId,
      error: error.message,
    };
  }
}

async function verifyProgram(
  connection: Connection,
  result: DeployResult
): Promise<void> {
  const programId = new PublicKey(result.programId);
  const accountInfo = await connection.getAccountInfo(programId);

  if (!accountInfo) {
    throw new Error(`Program ${result.programName} not found on chain`);
  }

  if (!accountInfo.executable) {
    throw new Error(`Program ${result.programName} is not executable`);
  }

  logger.success(`✅ ${result.programName} verified on chain`);
}
