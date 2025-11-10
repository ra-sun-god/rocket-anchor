# 🚀 Rocket Anchor

Hardhat-style deployment tool for Solana Anchor programs with seeding support.

## Installation

### Global Installation
```bash
npm install -g rocket-anchor
```

### Local Installation
```bash
npm install --save-dev rocket-anchor
```

## Quick Start

### 1. Initialize Configuration
```bash
npx ra init
```

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

### 3. Create Seed Configuration (Optional)
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
      args: ['My Program', 100],
    },
  },
];

export default seeds;
```

### 4. Deploy & Seed
```bash
# Deploy and run seeds
npx ra deploy --network devnet --seed

# Or separately
npx ra deploy --network devnet
npx ra seed --network devnet
```

## CLI Commands

### Deploy
```bash
# Basic deployment
npx ra deploy --network devnet

# Deploy specific program
npx ra deploy --network devnet --program my_program

# Deploy with seeding
npx ra deploy --network devnet --seed

# Deploy with custom seed script
npx ra deploy --network devnet --seed --seed-script ./scripts/custom.ts

# Skip build
npx ra deploy --network devnet --skip-build

# Deploy and verify
npx ra deploy --network mainnet --verify
```

### Seed
```bash
# Run seeds
npx ra seed --network devnet

# Seed specific program
npx ra seed --network devnet --program my_program

# Use custom seed script
npx ra seed --network devnet --script ./scripts/custom.ts
```

### Other Commands
```bash
# Initialize config
npx ra init

# Build programs
npx ra build

# Build with verifiable flag
npx ra build --verifiable

# Run tests
npx ra test
```

## Seed Configuration

### Account Resolution Patterns

```typescript
accounts: {
  // Use deployer wallet
  authority: 'signer',
  payer: 'payer',
  
  // System programs
  systemProgram: 'systemProgram',
  rent: 'rent',
  
  // Generate new keypair
  newAccount: 'new:',
  
  // Derive PDA
  vault: 'pda:vault',
  userVault: 'pda:vault:signer',
  
  // Direct public key
  treasury: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
}
```

### Complete Example

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
      args: [0],
    },
    seeds: [
      {
        function: 'createUser',
        accounts: {
          authority: 'signer',
          user: 'new:',
          systemProgram: 'systemProgram',
        },
        args: ['Alice', 25],
        repeat: 3, // Create 3 users
      },
    ],
  },
];
```

## Programmatic Usage

```typescript
import { RocketAnchor } from 'rocket-anchor';

const ra = new RocketAnchor();

// Load config
await ra.loadConfig();

// Deploy with seeding
const results = await ra.deploy({
  network: 'devnet',
  seed: true,
});

// Seed separately
await ra.seed('devnet', 'my_program');
```

## Configuration

### Network Config
```typescript
interface NetworkConfig {
  url: string;              // RPC endpoint
  accounts?: string[];      // Keypair paths
  timeout?: number;         // Transaction timeout
  commitment?: Commitment;  // Commitment level
  skipPreflight?: boolean;  // Skip preflight
  websocket?: string;       // WebSocket endpoint
}
```

### Seed Config
```typescript
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

## Examples

### Example 1: Counter Program
```rust
// Rust program
#[program]
pub mod counter {
    pub fn initialize(ctx: Context<Initialize>, count: u64) -> Result<()> {
        ctx.accounts.counter.count = count;
        Ok(())
    }
    
    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        ctx.accounts.counter.count += 1;
        Ok(())
    }
}
```

```typescript
// Seed config
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
        repeat: 5,
      },
    ],
  },
];
```

```bash
# Deploy and seed
npx ra deploy --network devnet --seed
# Counter will be 5 (0 + 5 increments)
```

## Best Practices

1. **Separate keypairs per network**
```typescript
networks: {
  devnet: { accounts: ['./keypairs/devnet.json'] },
  mainnet: { accounts: ['./keypairs/mainnet.json'] },
}
```

2. **Use environment variables**
```typescript
import * as dotenv from 'dotenv';
dotenv.config();

const config: RAConfig = {
  networks: {
    mainnet: {
      url: process.env.MAINNET_RPC_URL!,
      accounts: [process.env.DEPLOYER_KEYPAIR!],
    },
  },
};
```

3. **Test on devnet first**
```bash
npx ra deploy --network devnet --seed
# Test thoroughly
npx ra deploy --network mainnet
```

4. **Always verify mainnet deployments**
```bash
npx ra deploy --network mainnet --verify
```

## Development

```bash
# Clone repository
git clone https://github.com/ra-sun-god/rocket-anchor.git
cd rocket-anchor

# Install dependencies
npm install

# Build
npm run build

# Link for local testing
npm link

# Test
ra --version
```

## Project Structure

```
rocket-anchor/
├── src/
│   ├── index.ts              # Main exports
│   ├── cli.ts                # CLI commands
│   ├── types.ts              # TypeScript types
│   ├── config-loader.ts      # Config loading
│   ├── deployer.ts           # Deployment logic
│   ├── seeder.ts             # Seeding logic
│   ├── keypair-loader.ts     # Keypair utilities
│   └── utils/
│       ├── logger.ts         # Logging
│       └── program-finder.ts # Program discovery
├── bin/
│   └── ra.js                 # CLI entry
├── package.json
├── tsconfig.json
└── README.md
```

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.

## Support

- GitHub: https://github.com/ra-sun-god/rocket-anchor
- Issues: https://github.com/ra-sun-god/rocket-anchor/issues

---

Made with ❤️ for the Solana community
