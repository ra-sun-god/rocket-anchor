# 🚀 Rocket Anchor (RA)

**Hardhat-style deployment toolkit for Solana Anchor programs with advanced seeding capabilities.**

Rocket Anchor brings the familiar Hardhat developer experience to Solana, making it easy to deploy, manage, and seed your Anchor programs across multiple networks with a simple, declarative configuration.

[![npm version](https://badge.fury.io/js/rocket-anchor.svg)](https://www.npmjs.com/package/rocket-anchor)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📋 Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [CLI Commands](#-cli-commands)
- [Seeding & Initialization](#-seeding--initialization)
- [Programmatic Usage](#-programmatic-usage)
- [Advanced Topics](#-advanced-topics)
- [Examples](#-examples)
- [Best Practices](#-best-practices)
- [Troubleshooting](#-troubleshooting)
- [CI/CD Integration](#-cicd-integration)
- [API Reference](#-api-reference)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

- **🎯 Hardhat-style Configuration** - Familiar `ra.config.ts` for network and deployment settings
- **🌐 Multi-Network Support** - Easy switching between localnet, devnet, testnet, and mainnet
- **🌱 Declarative Seeding** - Initialize and populate programs with simple configuration
- **🔑 Flexible Keypair Management** - Support for file paths, base58 strings, and environment variables
- **🔄 PDA Resolution** - Automatic Program Derived Address generation in seed scripts
- **✅ Deployment Verification** - Built-in on-chain verification
- **📦 Automated Building** - Integrated Anchor build support
- **🎨 Beautiful CLI** - Colored output with clear progress indicators
- **📝 TypeScript First** - Full type safety and IntelliSense support
- **🔌 Programmatic API** - Use in your own scripts and tools
- **🚀 Fast & Efficient** - Optimized deployment pipeline

---

## 📦 Installation

### Global Installation (Recommended for CLI)

```bash
npm install -g rocket-anchor
```

### Local Installation (For Project Integration)

```bash
npm install --save-dev rocket-anchor
```

### Using with npx (No Installation)

```bash
npx rocket-anchor init
```

---

## 🚀 Quick Start

### 1. Initialize Configuration

```bash
npx ra init
```

This creates `ra.config.ts` in your project root.

### 2. Configure Networks

Edit `ra.config.ts`:

```typescript
import { RAConfig } from 'rocket-anchor';

const config: RAConfig = {
  networks: {
    devnet: {
      url: 'https://api.devnet.solana.com',
      accounts: ['~/.config/solana/devnet.json'],
      commitment: 'confirmed',
    },
  },
};

export default config;
```

### 3. Deploy Your Program

```bash
npx ra deploy --network devnet
```

### 4. (Optional) Add Seeding

Create `seeds/index.ts`:

```typescript
import { SeedConfig } from 'rocket-anchor';

export const seeds: SeedConfig[] = [
  {
    program: 'my_program',
    initialize: {
      function: 'initialize',
      accounts: {
        authority: 'signer',
        state: 'pda:state',
        systemProgram: 'systemProgram',
      },
      args: ['Production', 1000],
    },
  },
];

export default seeds;
```

Deploy with seeding:

```bash
npx ra deploy --network devnet --seed
```

---

## ⚙️ Configuration

### Network Configuration

```typescript
interface NetworkConfig {
  url: string;              // RPC endpoint URL
  accounts?: string[];      // Keypair paths or base58 keys
  timeout?: number;         // Transaction timeout (ms)
  commitment?: Commitment;  // 'processed' | 'confirmed' | 'finalized'
  skipPreflight?: boolean;  // Skip preflight checks
  websocket?: string;       // WebSocket endpoint (optional)
}
```

### Complete Configuration Example

```typescript
import { RAConfig } from 'rocket-anchor';
import * as dotenv from 'dotenv';

dotenv.config();

const config: RAConfig = {
  networks: {
    localnet: {
      url: 'http://127.0.0.1:8899',
      accounts: ['~/.config/solana/id.json'],
      commitment: 'confirmed',
    },
    devnet: {
      url: process.env.DEVNET_RPC_URL || 'https://api.devnet.solana.com',
      accounts: [process.env.DEVNET_KEYPAIR_PATH!],
      commitment: 'confirmed',
      timeout: 60000,
    },
    testnet: {
      url: 'https://api.testnet.solana.com',
      accounts: ['./keypairs/testnet.json'],
      commitment: 'confirmed',
    },
    mainnet: {
      url: process.env.MAINNET_RPC_URL || 'https://api.mainnet-beta.solana.com',
      accounts: [process.env.MAINNET_KEYPAIR_PATH!],
      commitment: 'finalized',
      skipPreflight: false,
      timeout: 90000,
      websocket: 'wss://api.mainnet-beta.solana.com',
    },
  },
  paths: {
    programs: './programs',
    tests: './tests',
    artifacts: './target',
  },
  solana: {
    version: '1.18.0',
  },
  anchor: {
    version: '0.29.0',
  },
};

export default config;
```

---

## 🖥️ CLI Commands

### Deploy

Deploy Anchor programs to a specified network.

```bash
# Basic deployment
npx ra deploy --network devnet

# Deploy specific program
npx ra deploy --network devnet --program token_vault

# Skip build step
npx ra deploy --network devnet --skip-build

# Deploy and verify
npx ra deploy --network mainnet --verify

# Deploy as non-upgradeable
npx ra deploy --network mainnet --upgradeable false

# Deploy and run seeds
npx ra deploy --network devnet --seed

# Deploy with custom seed script
npx ra deploy --network devnet --seed --seed-script ./scripts/custom.ts
```

### Seed

Run initialization and seed scripts for deployed programs.

```bash
# Run seeds
npx ra seed --network devnet

# Seed specific program
npx ra seed --network devnet --program my_program

# Use custom seed script
npx ra seed --network devnet --script ./scripts/advanced-seed.ts
```

### Build

Build Anchor programs.

```bash
# Standard build
npx ra build

# Verifiable build
npx ra build --verifiable
```

### Test

Run Anchor tests.

```bash
# Run tests on localnet
npx ra test

# Run tests on specific network
npx ra test --network devnet
```

### Init

Initialize configuration file.

```bash
npx ra init
```

---

## 🌱 Seeding & Initialization

Rocket Anchor provides powerful seeding capabilities to automatically initialize and populate your programs after deployment.

### Basic Seed Configuration

Create `seeds/index.ts`:

```typescript
import { SeedConfig } from 'rocket-anchor';

export const seeds: SeedConfig[] = [
  {
    program: 'counter',
    initialize: {
      function: 'initialize',
      accounts: {
        counter: 'pda:counter',
        authority: 'signer',
        systemProgram: 'systemProgram',
      },
      args: [0], // initial_count
    },
    seeds: [
      {
        function: 'increment',
        accounts: {
          counter: 'pda:counter',
          authority: 'signer',
        },
        args: [],
        repeat: 5, // Run 5 times
      },
    ],
  },
];

export default seeds;
```

### Account Resolution Patterns

Rocket Anchor supports multiple account resolution patterns:

#### 1. **Signer/Payer**
```typescript
accounts: {
  authority: 'signer',    // Uses deployer wallet
  payer: 'payer',         // Also uses deployer wallet
}
```

#### 2. **System Programs**
```typescript
accounts: {
  systemProgram: 'systemProgram',  // SystemProgram.programId
  rent: 'rent',                     // SYSVAR_RENT_PUBKEY
}
```

#### 3. **Generate New Keypair**
```typescript
accounts: {
  newAccount: 'new:',  // Generates and signs with new keypair
}
```

#### 4. **Derive PDA**
```typescript
accounts: {
  vault: 'pda:vault',              // Single seed
  userVault: 'pda:vault:signer',   // Multiple seeds
}
```

#### 5. **Direct Public Key**
```typescript
accounts: {
  treasury: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
}
```

### Advanced Seed Example

```typescript
import { SeedConfig } from 'rocket-anchor';

export const seeds: SeedConfig[] = [
  {
    program: 'marketplace',
    initialize: {
      function: 'initialize',
      accounts: {
        marketplace: 'pda:marketplace',
        authority: 'signer',
        feeRecipient: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        systemProgram: 'systemProgram',
        rent: 'rent',
      },
      args: [
        500,     // fee_basis_points (5%)
        'Main Marketplace',
      ],
    },
    seeds: [
      {
        function: 'createCollection',
        accounts: {
          marketplace: 'pda:marketplace',
          collection: 'new:',
          authority: 'signer',
          systemProgram: 'systemProgram',
        },
        args: ['NFT Collection', 'NFTC'],
        repeat: 3, // Create 3 collections
      },
      {
        function: 'updateFee',
        accounts: {
          marketplace: 'pda:marketplace',
          authority: 'signer',
        },
        args: [250], // Lower fee to 2.5%
      },
    ],
  },
];

export default seeds;
```

### Custom Seed Scripts

For complex seeding logic, create custom TypeScript scripts:

```typescript
// scripts/custom-seed.ts
import * as anchor from '@coral-xyz/anchor';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { PublicKey, Keypair, SystemProgram } from '@solana/web3.js';

export async function customSeed(
  provider: AnchorProvider, 
  programId: PublicKey
) {
  const program = new Program(idl, programId, provider);

  // Complex initialization logic
  const config = await program.account.config.fetch(configPda);
  
  if (config.initialized) {
    console.log('Already initialized, skipping...');
    return;
  }

  // Conditional seeding based on network
  const network = provider.connection.rpcEndpoint;
  const isMainnet = network.includes('mainnet');
  
  const feeRate = isMainnet ? 100 : 50; // 1% mainnet, 0.5% devnet

  await program.methods
    .initialize(feeRate)
    .accounts({
      config: configPda,
      authority: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log('Custom seed completed!');
}

export default customSeed;
```

Use custom script:

```bash
npx ra seed --network devnet --script ./scripts/custom-seed.ts
```

---

## 💻 Programmatic Usage

Rocket Anchor can be used programmatically in your TypeScript/JavaScript projects.

### Basic Usage

```typescript
import { RocketAnchor } from 'rocket-anchor';

async function deployPrograms() {
  const ra = new RocketAnchor();
  
  // Load configuration
  await ra.loadConfig('./ra.config.ts');
  
  // Deploy
  const results = await ra.deploy({
    network: 'devnet',
    program: 'my_program',
    skipBuild: false,
    verify: true,
    seed: true,
  });
  
  // Check results
  results.forEach(result => {
    if (result.success) {
      console.log(`✅ ${result.programName}: ${result.programId}`);
      console.log(`   Tx: ${result.txSignature}`);
    } else {
      console.error(`❌ ${result.programName}: ${result.error}`);
    }
  });
}

deployPrograms().catch(console.error);
```

### Advanced Usage

```typescript
import { RocketAnchor, DeployOptions } from 'rocket-anchor';

class DeploymentManager {
  private ra: RocketAnchor;
  
  constructor() {
    this.ra = new RocketAnchor();
  }
  
  async deployToMultipleNetworks(networks: string[]) {
    await this.ra.loadConfig();
    
    for (const network of networks) {
      console.log(`\nDeploying to ${network}...`);
      
      try {
        const results = await this.ra.deploy({
          network,
          verify: network === 'mainnet',
          seed: true,
        });
        
        await this.saveDeployment(network, results);
      } catch (error) {
        console.error(`Failed to deploy to ${network}:`, error);
      }
    }
  }
  
  async saveDeployment(network: string, results: DeployResult[]) {
    // Save deployment info to database or file
    const deployment = {
      network,
      timestamp: new Date().toISOString(),
      programs: results.map(r => ({
        name: r.programName,
        programId: r.programId,
        txSignature: r.txSignature,
      })),
    };
    
    // Save logic here
    console.log('Deployment saved:', deployment);
  }
  
  async seedWithRetry(network: string, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await this.ra.seed(network);
        console.log('Seeding successful');
        return;
      } catch (error) {
        console.log(`Seed attempt ${i + 1} failed, retrying...`);
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
}

// Usage
const manager = new DeploymentManager();
await manager.deployToMultipleNetworks(['devnet', 'testnet']);
```

---

## 🔧 Advanced Topics

### Environment Variables

Use `.env` files for sensitive data:

```env
# .env
DEVNET_RPC_URL=https://api.devnet.solana.com
MAINNET_RPC_URL=https://my-private-rpc.com
DEVNET_KEYPAIR_PATH=./keypairs/devnet.json
MAINNET_KEYPAIR_PATH=./keypairs/mainnet.json
```

```typescript
// ra.config.ts
import * as dotenv from 'dotenv';
dotenv.config();

const config: RAConfig = {
  networks: {
    devnet: {
      url: process.env.DEVNET_RPC_URL!,
      accounts: [process.env.DEVNET_KEYPAIR_PATH!],
    },
    mainnet: {
      url: process.env.MAINNET_RPC_URL!,
      accounts: [process.env.MAINNET_KEYPAIR_PATH!],
    },
  },
};
```

### Multiple Keypairs

Manage different keypairs for different purposes:

```typescript
const config: RAConfig = {
  networks: {
    mainnet: {
      url: 'https://api.mainnet-beta.solana.com',
      accounts: [
        './keypairs/mainnet-deployer.json',  // Primary deployer
        './keypairs/mainnet-authority.json', // Program authority
      ],
    },
  },
};
```

### Custom Build Commands

```typescript
// In your deployment script
import { execSync } from 'child_process';

// Custom build with features
execSync('anchor build -- --features mainnet', { stdio: 'inherit' });

// Then deploy
await ra.deploy({
  network: 'mainnet',
  skipBuild: true, // Already built
});
```

---

## 📚 Examples

### Example 1: Simple Counter Program

```rust
// programs/counter/src/lib.rs
use anchor_lang::prelude::*;

#[program]
pub mod counter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, initial_count: u64) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = initial_count;
        counter.authority = ctx.accounts.authority.key();
        Ok(())
    }

    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count += 1;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 8 + 32,
        seeds = [b"counter"],
        bump
    )]
    pub counter: Account<'info, Counter>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(mut, seeds = [b"counter"], bump)]
    pub counter: Account<'info, Counter>,
    pub authority: Signer<'info>,
}

#[account]
pub struct Counter {
    pub count: u64,
    pub authority: Pubkey,
}
```

```typescript
// seeds/index.ts
import { SeedConfig } from 'rocket-anchor';

export const seeds: SeedConfig[] = [
  {
    program: 'counter',
    initialize: {
      function: 'initialize',
      accounts: {
        counter: 'pda:counter',
        authority: 'signer',
        systemProgram: 'systemProgram',
      },
      args: [0],
    },
    seeds: [
      {
        function: 'increment',
        accounts: {
          counter: 'pda:counter',
          authority: 'signer',
        },
        args: [],
        repeat: 10,
      },
    ],
  },
];

export default seeds;
```

```bash
# Deploy and seed
npx ra deploy --network devnet --seed
# Counter will be at 10 (0 + 10 increments)
```

### Example 2: Token Vault

```typescript
// seeds/index.ts
import { SeedConfig } from 'rocket-anchor';

export const seeds: SeedConfig[] = [
  {
    program: 'token_vault',
    initialize: {
      function: 'initializeVault',
      accounts: {
        vault: 'pda:vault',
        authority: 'signer',
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
        systemProgram: 'systemProgram',
        tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        rent: 'rent',
      },
      args: [500], // 5% fee
    },
  },
];

export default seeds;
```

---

## 🎯 Best Practices

### 1. Security

**Never commit private keys:**

```.gitignore
# .gitignore
*.json
!package.json
!tsconfig.json
.env
keypairs/
```

**Use environment variables for sensitive data:**

```typescript
const config: RAConfig = {
  networks: {
    mainnet: {
      url: process.env.MAINNET_RPC_URL!,
      accounts: [process.env.MAINNET_KEYPAIR_PATH!],
    },
  },
};
```

**Use hardware wallets for mainnet:**

Consider integrating Ledger support for mainnet deployments.

### 2. Testing

**Always test on devnet first:**

```bash
# Test on devnet
npx ra deploy --network devnet --seed
# Thoroughly test all functionality
# Then deploy to mainnet
npx ra deploy --network mainnet --verify
```

**Use separate keypairs per network:**

```
keypairs/
├── localnet.json
├── devnet.json
├── testnet.json
└── mainnet.json
```

### 3. Deployment

**Verify mainnet deployments:**

```bash
npx ra deploy --network mainnet --verify
```

**Use verifiable builds for mainnet:**

```bash
npx ra build --verifiable
npx ra deploy --network mainnet --skip-build
```

**Keep deployment logs:**

```bash
npx ra deploy --network mainnet 2>&1 | tee deployment-$(date +%Y%m%d-%H%M%S).log
```

### 4. Configuration Management

**Use different configs for different environments:**

```
ra.config.dev.ts
ra.config.staging.ts
ra.config.prod.ts
```

```bash
export RA_CONFIG=ra.config.prod.ts
npx ra deploy --network mainnet
```

---

## 🔍 Troubleshooting

### Common Issues

#### Issue: "ra.config.ts not found"

**Solution:**

```bash
npx ra init
```

#### Issue: "Deployer account has no SOL balance"

**Solution:**

```bash
# For devnet
solana airdrop 2 <your-address> --url devnet

# For mainnet, fund your wallet
```

#### Issue: "Program keypair not found"

**Solution:**

```bash
# Build your program first
anchor build
```

#### Issue: "Network not found in config"

**Solution:**

Check your network name matches the config:

```typescript
networks: {
  devnet: { ... }  // Use: --network devnet
}
```

#### Issue: "IDL not found for program"

**Solution:**

```bash
# Ensure program is built
anchor build

# Check target/idl/ directory exists
ls target/idl/
```

### Debug Mode

Enable verbose logging:

```bash
DEBUG=ra:* npx ra deploy --network devnet
```

### Getting Help

- **GitHub Issues**: https://github.com/ra-sun-gold/rocket-anchor/issues
- **Discussions**: https://github.com/ra-sun-gold/rocket-anchor/discussions
- **Discord**: [Join our Discord](#)

---

## 🔄 CI/CD Integration

### GitHub Actions

```.github/workflows/deploy.yml
name: Deploy to Devnet

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Install Rocket Anchor
        run: npm install -g rocket-anchor
      
      - name: Setup Solana
        run: |
          sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"
          echo "$HOME/.local/share/solana/install/active_release/bin" >> $GITHUB_PATH
      
      - name: Setup Anchor
        run: |
          cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
          avm install 0.29.0
          avm use 0.29.0
      
      - name: Create keypair
        run: |
          echo '${{ secrets.DEPLOYER_KEYPAIR }}' > deployer.json
      
      - name: Deploy
        run: npx ra deploy --network devnet --seed
        env:
          DEPLOYER_KEYPAIR_PATH: ./deployer.json
      
      - name: Cleanup
        if: always()
        run: rm -f deployer.json
```

### GitLab CI

```.gitlab-ci.yml
deploy:
  stage: deploy
  image: node:18
  before_script:
    - npm install -g rocket-anchor
    - curl -sSfL https://release.solana.com/v1.18.0/install | sh
    - export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
  script:
    - echo "$DEPLOYER_KEYPAIR" > deployer.json
    - npx ra deploy --network devnet --seed
  after_script:
    - rm -f deployer.json
  only:
    - main
```

---

## 📖 API Reference

### RocketAnchor Class

```typescript
class RocketAnchor {
  // Load configuration from file
  async loadConfig(configPath?: string): Promise<RAConfig>
  
  // Deploy programs
  async deploy(options: DeployOptions): Promise<DeployResult[]>
  
  // Run seed scripts
  async seed(network: string, program?: string, seedScript?: string): Promise<void>
  
  // Get loaded configuration
  getConfig(): RAConfig | null
}
```

### Types

```typescript
interface DeployOptions {
  network: string;
  program?: string;
  skipBuild?: boolean;
  verify?: boolean;
  upgradeable?: boolean;
  programId?: string;
  seed?: boolean;
  seedScript?: string;
}

interface DeployResult {
  success: boolean;
  programName: string;
  programId: string;
  txSignature?: string;
  error?: string;
}

interface SeedConfig {
  program: string;
  initialize?: {
    function: string;
    accounts: { [key: string]: string };
    args: any[];
  };
  seeds?: {
    function: string;
    accounts: { [key: string]: string };
    args: any[];
    repeat?: number;
  }[];
}
```

### Functions

```typescript
// Load configuration
export function loadConfig(configPath?: string): Promise<RAConfig>

// Deploy programs
export function deploy(
  config: RAConfig,
  networkName: string,
  options: DeployOptions
): Promise<DeployResult[]>

// Run seed scripts
export function runSeeds(
  config: RAConfig,
  networkName: string,
  options: { program?: string; seedScript?: string }
): Promise<void>

// Load keypair
export function loadKeypair(keyPath?: string): Promise<Keypair>
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

### Development Setup

```bash
git clone https://github.com/ra-sun-gold/rocket-anchor.git
cd rocket-anchor
npm install
npm run build
npm link
```

### Running Tests

```bash
npm test
```

### Code Style

```bash
npm run lint
npm run format
```

### Submitting Changes

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit: `git commit -am 'Add new feature'`
6. Push: `git push origin feature/my-feature`
7. Create a Pull Request

### Commit Guidelines

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test updates
- `chore:` Build/tooling changes

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

Copyright (c) 2025 Ra <ra@maxxpainn.com>

---

## 🙏 Acknowledgments

- Inspired by [Hardhat](https://hardhat.org/)
- Built for [Anchor](https://www.anchor-lang.com/)
- Powered by [Solana](https://solana.com/)

---

## 📞 Support

- **Documentation**: https://github.com/ra-sun-gold/rocket-anchor
- **Issues**: https://github.com/ra-sun-gold/rocket-anchor/issues
- **Discussions**: https://github.com/ra-sun-gold/rocket-anchor/discussions
- **Email**: ra@maxxpainn.com

---

**Made with ❤️ for the Solana community**
