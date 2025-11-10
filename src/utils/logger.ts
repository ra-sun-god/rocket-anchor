/**
 * @project Anchor Rocket (RA)
 * @file utils/logger.ts
 * @description Logging utilities with colored console output for RocketAnchor.
 * Provides formatted logging methods for deployment and seeding operations.
 * 
 * @author Ra <ra@maxxpainn.com>
 * @created 2025-11-10
 * 
 * License: MIT
 */

import chalk from 'chalk';

export interface Logger {
  header: (message: string) => void;
  info: (message: string, ...args: any[]) => void;
  success: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  network: (name: string, url: string) => void;
  wallet: (address: string) => void;
  balance: (amount: number) => void;
  building: () => void;
  deploying: (programName: string) => void;
  programId: (id: string) => void;
  transaction: (signature: string) => void;
  verifying: () => void;
}

export function createLogger(): Logger {
  return {
    header: (message: string) => {
      console.log(chalk.blue.bold(`\n🚀 ${message}\n`));
    },
    
    info: (message: string, ...args: any[]) => {
      console.log(chalk.blue(message), ...args);
    },
    
    success: (message: string, ...args: any[]) => {
      console.log(chalk.green(message), ...args);
    },
    
    error: (message: string, ...args: any[]) => {
      console.error(chalk.red(message), ...args);
    },
    
    warn: (message: string, ...args: any[]) => {
      console.warn(chalk.yellow(message), ...args);
    },
    
    network: (name: string, url: string) => {
      console.log(chalk.yellow(`📡 Network: ${name}`));
      console.log(chalk.gray(`   URL: ${url}\n`));
    },
    
    wallet: (address: string) => {
      console.log(chalk.cyan(`👛 Deployer: ${address}`));
    },
    
    balance: (amount: number) => {
      console.log(chalk.cyan(`💰 Balance: ${amount.toFixed(4)} SOL\n`));
    },
    
    building: () => {
      console.log(chalk.yellow('🔨 Building programs...'));
    },
    
    deploying: (programName: string) => {
      console.log(chalk.blue(`\n📤 Deploying ${programName}...`));
    },
    
    programId: (id: string) => {
      console.log(chalk.gray(`   Program ID: ${id}`));
    },
    
    transaction: (signature: string) => {
      console.log(chalk.gray(`   Signature: ${signature}`));
    },
    
    verifying: () => {
      console.log(chalk.yellow('\n🔍 Verifying deployments...'));
    },
  };
}
