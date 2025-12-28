/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Migration Constants for Sky Protocol
 * Handles migration from MakerDAO (DAI/MKR) to Sky Protocol (USDS/SKY)
 */

export interface MigrationContract {
  name: string;
  address: string;
  fromToken: {
    symbol: string;
    address: string;
    decimals: number;
  };
  toToken: {
    symbol: string;
    address: string;
    decimals: number;
  };
  rate: string; // Conversion rate (e.g., "1:1" or "24000:1")
  description: string;
}

/**
 * Migration contracts for converting from legacy tokens to new tokens
 */
export const MIGRATION_CONTRACTS: Record<string, MigrationContract> = {
  daiToUsds: {
    name: 'DAI to USDS Migration',
    address: '0x3225737a9Bbb6473CB4a45b7244ACa2BeFdB276A',
    fromToken: {
      symbol: 'DAI',
      address: '0x6B175474E89094C44Da98b954EesC08111F',
      decimals: 18,
    },
    toToken: {
      symbol: 'USDS',
      address: '0xdC035D45d973E3EC169d2276DDab16f1e407384F',
      decimals: 18,
    },
    rate: '1:1',
    description: 'Convert DAI to USDS at 1:1 ratio',
  },
  mkrToSky: {
    name: 'MKR to SKY Migration',
    address: '0xBDcFCA946b6CDd965f99a839e4435Bcdc1bc470B',
    fromToken: {
      symbol: 'MKR',
      address: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
      decimals: 18,
    },
    toToken: {
      symbol: 'SKY',
      address: '0x56072C95FAA701256059aa122697B133aDEd9279',
      decimals: 18,
    },
    rate: '1:24000',
    description: 'Convert MKR to SKY at 1:24000 ratio',
  },
  sdaiToSusds: {
    name: 'sDAI to sUSDS Migration',
    address: '0x83F20F44975D03b1b09e64809B757c47f942BEeA',
    fromToken: {
      symbol: 'sDAI',
      address: '0x83F20F44975D03b1b09e64809B757c47f942BEeA',
      decimals: 18,
    },
    toToken: {
      symbol: 'sUSDS',
      address: '0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD',
      decimals: 18,
    },
    rate: '1:1',
    description: 'Convert sDAI to sUSDS at 1:1 ratio (plus accrued interest)',
  },
};

/**
 * MKR to SKY conversion rate
 * 1 MKR = 24,000 SKY
 */
export const MKR_TO_SKY_RATE = 24000n;

/**
 * DAI to USDS conversion rate
 * 1 DAI = 1 USDS
 */
export const DAI_TO_USDS_RATE = 1n;

/**
 * Get migration contract info
 */
export function getMigrationContract(migrationKey: string): MigrationContract {
  const contract = MIGRATION_CONTRACTS[migrationKey];
  if (!contract) {
    throw new Error(`Unknown migration: ${migrationKey}`);
  }
  return contract;
}

/**
 * Calculate SKY amount from MKR
 */
export function calculateSkyFromMkr(mkrAmount: bigint): bigint {
  return mkrAmount * MKR_TO_SKY_RATE;
}

/**
 * Calculate MKR amount from SKY
 */
export function calculateMkrFromSky(skyAmount: bigint): bigint {
  return skyAmount / MKR_TO_SKY_RATE;
}

/**
 * Calculate USDS amount from DAI
 */
export function calculateUsdsFromDai(daiAmount: bigint): bigint {
  return daiAmount * DAI_TO_USDS_RATE;
}

/**
 * Migration status types
 */
export enum MigrationStatus {
  NOT_STARTED = 'not_started',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Migration event types for tracking
 */
export const MIGRATION_EVENTS = {
  DAI_MIGRATED: 'DaiMigrated',
  MKR_MIGRATED: 'MkrMigrated',
  SDAI_MIGRATED: 'SDaiMigrated',
  VAULT_MIGRATED: 'VaultMigrated',
} as const;
