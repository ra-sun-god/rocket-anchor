/**
 * @project Anchor Rocket (RA)
 * @file seeder.ts
 * @description Seeding and initialization logic for RocketAnchor. Handles
 * automatic program initialization and seed data population using declarative
 * configuration or custom scripts.
 * 
 * @author Ra <ra@maxxpainn.com>
 * @created 2025-11-10
 * 
 * License: MIT
 */

import { Connection, Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import * as fs from 'fs';
import * as path from 'path';
import { RAConfig, SeedConfig } from './types';
import { loadKeypair } from './keypair-loader';
import { createLogger } from './utils/logger';

const logger = createLogger();

interface SeedOptions {
  program?: string;
  seedScript?: string;
}

export async function runSeeds(
  config: RAConfig,
  networkName: string,
  options: SeedOptions
): Promise<void> {
  const networkConfig = config.networks[networkName];
  
  const connection = new Connection(networkConfig.url, {
    commitment: networkConfig.commitment || 'confirmed',
  });

  const signer = await loadKeypair(networkConfig.accounts?.[0]);
  
  const wallet = new Wallet(signer);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: networkConfig.commitment || 'confirmed',
  });
  anchor.setProvider(provider);

  logger.info(`\n🌱 Seeding on ${networkName}...`);
  logger.wallet(signer.publicKey.toBase58());

  const seedConfigs = await loadSeedConfigs(config, options);

  for (const seedConfig of seedConfigs) {
    if (options.program && seedConfig.program !== options.program) {
      continue;
    }

    logger.info(`\n📝 Seeding ${seedConfig.program}...`);
    
    try {
      await seedProgram(provider, seedConfig, config);
      logger.success(`✅ ${seedConfig.program} seeded successfully`);
    } catch (error: any) {
      logger.error(`❌ Failed to seed ${seedConfig.program}:`, error);
      throw error;
    }
  }
}

async function loadSeedConfigs(
  config: RAConfig,
  options: SeedOptions
): Promise<SeedConfig[]> {
  if (options.seedScript) {
    const scriptPath = path.resolve(process.cwd(), options.seedScript);
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`Seed script not found: ${scriptPath}`);
    }
    
    const seedModule = await import(scriptPath);
    const seeds = seedModule.default || seedModule.seeds;
    return Array.isArray(seeds) ? seeds : [seeds];
  }

  const seedPaths = [
    path.join(process.cwd(), 'seeds', 'index.ts'),
    path.join(process.cwd(), 'seeds', 'index.js'),
    path.join(process.cwd(), 'scripts', 'seed.ts'),
    path.join(process.cwd(), 'scripts', 'seed.js'),
  ];

  for (const seedPath of seedPaths) {
    if (fs.existsSync(seedPath)) {
      const seedModule = await import(seedPath);
      const seeds = seedModule.default || seedModule.seeds;
      return Array.isArray(seeds) ? seeds : [seeds];
    }
  }

  throw new Error(
    'No seed configuration found. Create seeds/index.ts or use --seed-script'
  );
}

async function seedProgram(
    provider: AnchorProvider,
    seedConfig: SeedConfig,
    config: RAConfig
): Promise<void> {
  const artifactsPath = config.paths?.artifacts || './target';
  const idlPath = path.join(artifactsPath, 'idl', `${seedConfig.program}.json`);
  
  if (!fs.existsSync(idlPath)) {
    throw new Error(`IDL not found for ${seedConfig.program}: ${idlPath}`);
  }

  const idl = JSON.parse(fs.readFileSync(idlPath, 'utf-8'));
  
  const programKeypairPath = path.join(
    artifactsPath,
    'deploy',
    `${seedConfig.program}-keypair.json`
  );
  
  if (!fs.existsSync(programKeypairPath)) {
    throw new Error(`Program keypair not found: ${programKeypairPath}`);
  }

  const programKeypair = await loadKeypair(programKeypairPath);
  const programId = programKeypair.publicKey;

  const program = new Program(idl, provider);

  logger.info(`   Program ID: ${programId.toBase58()}`);

  if (seedConfig.initialize) {
    logger.info(`   🔧 Running initialize...`);
    await executeFunction(
      program,
      seedConfig.initialize.function,
      seedConfig.initialize.accounts,
      seedConfig.initialize.args,
      provider
    );
    logger.success(`   ✅ Initialize completed`);
  }

  if (seedConfig.seeds) {
    for (let i = 0; i < seedConfig.seeds.length; i++) {
      const seed = seedConfig.seeds[i];
      const repeat = seed.repeat || 1;
      
      logger.info(`   🌱 Running seed ${i + 1}/${seedConfig.seeds.length}...`);
      
      for (let j = 0; j < repeat; j++) {
        if (repeat > 1) {
          logger.info(`      Iteration ${j + 1}/${repeat}`);
        }
        
        await executeFunction(
          program,
          seed.function,
          seed.accounts,
          seed.args,
          provider
        );
      }
      
      logger.success(`   ✅ Seed ${i + 1} completed`);
    }
  }
}

async function executeFunction(
  program: Program,
  functionName: string,
  accounts: { [key: string]: string },
  args: any[],
  provider: AnchorProvider
): Promise<void> {
  
  const resolvedAccounts = processAccountPlaceHolders(program, provider, accounts);
  const processedArgs = processArgsPlaceholders(program, provider, args);

  const method = (program.methods as any)[functionName](...processedArgs);
  method.accounts(resolvedAccounts);
  
  const signers: Keypair[] = [];
  for (const [key, value] of Object.entries(resolvedAccounts)) {
    if (key.endsWith('_keypair')) {
      signers.push(value as any);
    }
  }
  
  if (signers.length > 0) {
    method.signers(signers);
  }

  const tx = await method.rpc();
  logger.info(`      Tx: ${tx}`);
}


const processAccountPlaceHolders = (
  program: Program,
  provider: AnchorProvider,
  accounts: { [key: string]: string },

) => {

   const resolvedAccounts: { [key: string]: PublicKey } = {};
  
  for (const [key, value] of Object.entries(accounts)) {

    try {

      if (value === 'signer' || value === 'payer') {
        resolvedAccounts[key] = provider.wallet.publicKey;
      } else if (value === 'systemProgram') {
        resolvedAccounts[key] = SystemProgram.programId;
      } else if (value === 'rent') {
        resolvedAccounts[key] = SYSVAR_RENT_PUBKEY;
      } else if (value.startsWith('new:')) {
        const keypair = Keypair.generate();
        resolvedAccounts[key] = keypair.publicKey;
        (resolvedAccounts as any)[`${key}_keypair`] = keypair;
      } else if (value.startsWith('pda:')) {
        const [_, ...seeds] = value.split(':');
        const seedBuffers = seeds.map(s => {
          if (s === 'signer') {
            return provider.wallet.publicKey.toBuffer();
          }
          return Buffer.from(s);
        });
        
        const [pda] = PublicKey.findProgramAddressSync(
          seedBuffers,
          program.programId
        );
        resolvedAccounts[key] = pda;
      } else {
        resolvedAccounts[key] = new PublicKey(value);
      }
    } catch(e){
      console.error(`processAccountPlaceHolders Error: ${key}: ${value}`)
      throw e;
    }
  }

  return resolvedAccounts;
}

const processArgsPlaceholders = (
  program: Program,
  provider: AnchorProvider,
  args: any[]
) => {

  const processedArgs: any[number] = [];

  for (const [key, value] of Object.entries(args)) {

    try {
      
      if (value === 'signer' || value === 'payer') {
        
        processedArgs[key] = provider.wallet.publicKey;
      
      } else if (value === 'systemProgram') {
        
        processedArgs[key] = SystemProgram.programId;
      
      } else if (value === 'rent') {
        
        processedArgs[key] = SYSVAR_RENT_PUBKEY;

      } else if (value.startsWith('pda:')) {
        
        const [_, ...seeds] = value.split(':');

        const seedBuffers = seeds.map((s: any)=> {
          if (s === 'signer') {
            return provider.wallet.publicKey.toBuffer();
          }
          return Buffer.from(s);
        });
        
        const [pda] = PublicKey.findProgramAddressSync(
          seedBuffers,
          program.programId
        );
        processedArgs[key] = pda;
      
      } else if (['number', 'bigint'].includes(value)) {
        processedArgs[key] = new anchor.BN(value.toString())
      } 
      else {
        processedArgs[key] = value;
      }

    } catch(e) {
       console.error(`processArgsPlaceholders Error: ${key}: ${value}`)
      throw e;
    }
  
  } //end loop

  return processedArgs;

}