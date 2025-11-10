import { Commitment } from '@solana/web3.js';

export interface NetworkConfig {
  url: string;
  accounts?: string[];
  timeout?: number;
  commitment?: Commitment;
  skipPreflight?: boolean;
  websocket?: string;
}

export interface PathsConfig {
  programs?: string;
  tests?: string;
  artifacts?: string;
}

export interface RAConfig {
  networks: {
    [key: string]: NetworkConfig;
  };
  paths?: PathsConfig;
  solana?: {
    version?: string;
  };
  anchor?: {
    version?: string;
  };
}

export interface DeployOptions {
  network: string;
  program?: string;
  skipBuild?: boolean;
  verify?: boolean;
  upgradeable?: boolean;
  programId?: string;
  seed?: boolean;
  seedScript?: string;
}

export interface ProgramInfo {
  name: string;
  soPath: string;
  keypairPath: string;
  programId?: string;
  idlPath?: string;
}

export interface DeployResult {
  success: boolean;
  programName: string;
  programId: string;
  txSignature?: string;
  error?: string;
}

export interface SeedConfig {
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
