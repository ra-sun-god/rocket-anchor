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
import { BN } from '@coral-xyz/anchor';
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import * as fs from 'fs';
import * as path from 'path';
import { RAConfig, SeedConfig } from './types';
import { loadKeypair } from './keypair-loader';
import { createLogger } from './utils/logger';
import { delay, isValidPublicKey } from './utils';

const logger = createLogger();

interface SeedOptions {
  program?: string;
  seedScript?: string;
}

type PlaceholderType = "args" | "accounts"

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
    logger.info(`Calling program method: ${seedConfig.initialize.function}`)
    
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
        
      logger.info(`      Calling program method: ${seed.function}`)

        await executeFunction(
          program,
          seed.function,
          seed.accounts,
          seed.args,
          provider
        );
      }
      
      logger.success(`   ✅ Seed ${i + 1} (${seed.function}) completed`);
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
  
  const resolvedAccounts = processPlaceholders(program, provider, accounts, "accounts");
  const processedArgs = processPlaceholders(program, provider, args, "args");

  const method = (program.methods as any)[functionName](...processedArgs);
  method.accountsStrict(resolvedAccounts);
  
  const signers: Keypair[] = [];

  for (const [key, value] of Object.entries(resolvedAccounts)) {
    if (key.endsWith('_keypair')) {
      signers.push(value as any);
    }
  }
  
  if (signers.length > 0) {
    method.signers(signers);
  }

  const txSig = await method.rpc({ commitment: "confirmed" });
  
  logger.info(`      Tx: ${txSig}`);

  const eventParser = new anchor.EventParser(program.programId,  program.coder);

  await delay(1000);
          
  // Now, fetching the transaction should be much more reliable.
  const tx = await provider.connection.getParsedTransaction(txSig, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });

  let logs = tx?.meta?.logMessages || [];

  for (const event of eventParser.parseLogs(logs)) {
    logger.info(JSON.stringify(event, null, 2))
    console.log()
  }
}



const processPlaceholders = (
  program: Program,
  provider: AnchorProvider,
  data: any[] | { [key: string]: string },
  placeholderType: PlaceholderType
) => {

  const processedData: any[number] | { [key: string]: string } = Array.isArray(data) ? [] : {};

  for (const [key, value] of Object.entries(data)) {

    try {
      
  
      if(typeof value == 'object' || !['number', 'bigint', 'string'].includes(typeof value)) {
        processedData[key] = value;
      }

      else if (['number', 'bigint'].includes(typeof value)) {
        processedData[key] = new anchor.BN(value.toString())
      } 

      else if (isValidPublicKey(value)) {
         processedData[key] = new PublicKey(value)
      }

      else if (value === 'signer' || value === 'payer') {
        
        processedData[key] = provider.wallet.publicKey;
      
      } else if (value === 'systemProgram') {
        
        processedData[key] = SystemProgram.programId;
      
      } else if (value === 'rent') {
        
        processedData[key] = SYSVAR_RENT_PUBKEY;

      } else if (typeof value === 'string' && value.startsWith('new:')) {
        
        const keypair = Keypair.generate();
        processedData[key] = keypair.publicKey;

        if(placeholderType == "accounts"){
          (processedData as any)[`${key}_keypair`] = keypair;
        }

      } else if (typeof value === 'string' && value.startsWith('pda:')) {
        
        const processPda = (str: string) => { 
          
          let newStr = str.replace(/^pda:/, "");

          const seeds = newStr.split(',');

          const seedBuffers: any[] = seeds.map((s: any)=> {
            if (s === 'signer') { 
              return provider.wallet.publicKey.toBuffer(); 
            } else if(typeof s == 'string' && s.startsWith("pda:")) {
              return processPda(s).toBuffer()
            } else {
              return Buffer.from(s);
            }
          });
          
          const [pda] = PublicKey.findProgramAddressSync(
            seedBuffers,
            program.programId
          );

          return pda;
        }

        processedData[key] = processPda(value);
      
      }
      else {

          if(placeholderType == "args") {
             processedData[key] = value;
          } else {
            processedData[key] =  new PublicKey(value.toString());
          }
      }

    } catch(e) {
       console.error(`processPlaceholders: processing ${placeholderType} error for: ${key}: ${value}`)
      throw e;
    }
  
  } //end loop

  return processedData;

}