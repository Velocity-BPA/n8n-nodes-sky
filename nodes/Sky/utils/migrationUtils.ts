/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Migration Utilities for Sky Protocol
 * Helper functions for migrating from MakerDAO to Sky Protocol.
 */

import {
  MKR_TO_SKY_RATE,
  DAI_TO_USDS_RATE,
  MigrationStatus,
} from '../constants/migration';

/**
 * Migration result interface
 */
export interface MigrationResult {
  fromToken: string;
  toToken: string;
  fromAmount: bigint;
  toAmount: bigint;
  rate: string;
  txHash?: string;
  status: MigrationStatus;
}

/**
 * Calculate output amount for DAI to USDS migration
 * 1 DAI = 1 USDS
 */
export function calculateDaiToUsds(daiAmount: bigint): bigint {
  return daiAmount * DAI_TO_USDS_RATE;
}

/**
 * Calculate output amount for USDS to DAI migration (reverse)
 * 1 USDS = 1 DAI
 */
export function calculateUsdsToDai(usdsAmount: bigint): bigint {
  return usdsAmount / DAI_TO_USDS_RATE;
}

/**
 * Calculate output amount for MKR to SKY migration
 * 1 MKR = 24,000 SKY
 */
export function calculateMkrToSky(mkrAmount: bigint): bigint {
  return mkrAmount * MKR_TO_SKY_RATE;
}

/**
 * Calculate equivalent MKR for SKY amount (for reference only)
 * Note: SKY to MKR migration is not supported
 */
export function calculateSkyToMkrEquivalent(skyAmount: bigint): bigint {
  return skyAmount / MKR_TO_SKY_RATE;
}

/**
 * Validate migration amount
 */
export function validateMigrationAmount(
  amount: bigint,
  balance: bigint,
): { valid: boolean; error?: string } {
  if (amount <= 0n) {
    return { valid: false, error: 'Amount must be positive' };
  }

  if (amount > balance) {
    return {
      valid: false,
      error: `Insufficient balance. Available: ${balance.toString()}`,
    };
  }

  return { valid: true };
}

/**
 * Check if address has approved migration contract
 */
export function hasApproval(
  allowance: bigint,
  amount: bigint,
): boolean {
  return allowance >= amount;
}

/**
 * Calculate required approval amount
 * Returns max uint256 for unlimited approval or specific amount
 */
export function calculateApprovalAmount(
  amount: bigint,
  unlimited: boolean = false,
): bigint {
  if (unlimited) {
    return 2n ** 256n - 1n; // Max uint256
  }
  return amount;
}

/**
 * Format migration rate for display
 */
export function formatMigrationRate(fromToken: string, toToken: string): string {
  if (fromToken === 'DAI' && toToken === 'USDS') {
    return '1:1';
  }
  if (fromToken === 'USDS' && toToken === 'DAI') {
    return '1:1';
  }
  if (fromToken === 'MKR' && toToken === 'SKY') {
    return `1:${MKR_TO_SKY_RATE.toString()}`;
  }
  if (fromToken === 'sDAI' && toToken === 'sUSDS') {
    return '1:1 + accrued yield';
  }
  return 'Unknown';
}

/**
 * Get migration type from tokens
 */
export function getMigrationType(
  fromToken: string,
  toToken: string,
): string | null {
  const migrations: Record<string, string> = {
    'DAI:USDS': 'daiToUsds',
    'MKR:SKY': 'mkrToSky',
    'sDAI:sUSDS': 'sdaiToSusds',
  };

  return migrations[`${fromToken}:${toToken}`] || null;
}

/**
 * Check if migration is supported
 */
export function isMigrationSupported(
  fromToken: string,
  toToken: string,
): boolean {
  return getMigrationType(fromToken, toToken) !== null;
}

/**
 * Migration eligibility check result
 */
export interface MigrationEligibility {
  eligible: boolean;
  balance: bigint;
  approved: boolean;
  allowance: bigint;
  requirements: string[];
}

/**
 * Check migration eligibility
 */
export function checkMigrationEligibility(
  balance: bigint,
  allowance: bigint,
  amount: bigint,
): MigrationEligibility {
  const requirements: string[] = [];
  let eligible = true;

  if (balance < amount) {
    requirements.push(`Insufficient balance. Need: ${amount.toString()}, Have: ${balance.toString()}`);
    eligible = false;
  }

  const approved = allowance >= amount;
  if (!approved) {
    requirements.push(`Approval required. Current allowance: ${allowance.toString()}`);
  }

  return {
    eligible,
    balance,
    approved,
    allowance,
    requirements,
  };
}

/**
 * Build migration transaction data
 */
export interface MigrationTxData {
  to: string;
  data: string;
  value: bigint;
  gasLimit?: bigint;
}

/**
 * Estimate gas for migration
 */
export function estimateMigrationGas(migrationType: string): bigint {
  // Approximate gas estimates
  const gasEstimates: Record<string, bigint> = {
    daiToUsds: 100000n,
    mkrToSky: 120000n,
    sdaiToSusds: 150000n,
    approval: 50000n,
  };

  return gasEstimates[migrationType] || 200000n;
}

/**
 * Format migration result for display
 */
export function formatMigrationResult(result: MigrationResult): Record<string, string> {
  return {
    fromToken: result.fromToken,
    toToken: result.toToken,
    fromAmount: result.fromAmount.toString(),
    toAmount: result.toAmount.toString(),
    rate: result.rate,
    txHash: result.txHash || 'N/A',
    status: result.status,
  };
}

/**
 * Parse migration event from transaction receipt
 */
export function parseMigrationEvent(
  eventName: string,
  data: string,
  topics: string[],
): { from: string; amount: bigint } | null {
  try {
    // Basic parsing - in production, use ethers.js Interface
    const from = '0x' + topics[1]?.slice(26);
    const amount = BigInt(data);
    return { from, amount };
  } catch {
    return null;
  }
}

/**
 * Get migration status description
 */
export function getMigrationStatusDescription(status: MigrationStatus): string {
  const descriptions: Record<MigrationStatus, string> = {
    [MigrationStatus.NOT_STARTED]: 'Migration has not been initiated',
    [MigrationStatus.PENDING_APPROVAL]: 'Waiting for token approval',
    [MigrationStatus.APPROVED]: 'Token approved, ready to migrate',
    [MigrationStatus.IN_PROGRESS]: 'Migration transaction pending',
    [MigrationStatus.COMPLETED]: 'Migration completed successfully',
    [MigrationStatus.FAILED]: 'Migration failed',
  };

  return descriptions[status] || 'Unknown status';
}
