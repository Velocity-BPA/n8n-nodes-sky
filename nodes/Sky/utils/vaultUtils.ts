/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Vault Utilities for Sky Protocol
 * Helper functions for vault management operations.
 */

import {
  WAD,
  RAY,
  fromWad,
  fromRay,
  wmul,
  wdiv,
  rmul,
  rdiv,
  rayToWad,
  wadToRay,
  radToWad,
  calculateCollateralRatio,
  calculateLiquidationPrice,
  calculateMaxDebt,
  calculateMaxWithdraw,
  formatAmount,
} from './mathUtils';

/**
 * Vault status types
 */
export enum VaultStatus {
  SAFE = 'safe',
  WARNING = 'warning',
  DANGER = 'danger',
  LIQUIDATABLE = 'liquidatable',
}

/**
 * Vault health thresholds (percentage of liquidation ratio)
 */
export const HEALTH_THRESHOLDS = {
  SAFE: 200, // 200% of liquidation ratio
  WARNING: 150, // 150% of liquidation ratio
  DANGER: 120, // 120% of liquidation ratio
};

/**
 * Vault information interface
 */
export interface VaultInfo {
  id: number;
  owner: string;
  ilk: string;
  collateral: bigint;
  debt: bigint;
  collateralRatio: number;
  liquidationPrice: bigint;
  status: VaultStatus;
  maxWithdraw: bigint;
  maxDebt: bigint;
}

/**
 * Ilk (collateral type) parameters interface
 */
export interface IlkParams {
  ilk: string;
  art: bigint; // Total normalized debt
  rate: bigint; // Accumulated stability fee rate
  spot: bigint; // Price with safety margin
  line: bigint; // Debt ceiling
  dust: bigint; // Minimum debt
  mat: bigint; // Liquidation ratio
  duty: bigint; // Stability fee rate
  chop: bigint; // Liquidation penalty
}

/**
 * Determine vault status based on collateral ratio and liquidation ratio
 */
export function getVaultStatus(
  collateralRatio: number,
  liquidationRatio: number,
): VaultStatus {
  const safeThreshold = liquidationRatio * (HEALTH_THRESHOLDS.SAFE / 100);
  const warningThreshold = liquidationRatio * (HEALTH_THRESHOLDS.WARNING / 100);
  const dangerThreshold = liquidationRatio * (HEALTH_THRESHOLDS.DANGER / 100);

  if (collateralRatio < liquidationRatio) {
    return VaultStatus.LIQUIDATABLE;
  } else if (collateralRatio < dangerThreshold) {
    return VaultStatus.DANGER;
  } else if (collateralRatio < warningThreshold) {
    return VaultStatus.WARNING;
  }
  return VaultStatus.SAFE;
}

/**
 * Calculate vault information from raw data
 */
export function calculateVaultInfo(
  vaultId: number,
  owner: string,
  ilk: string,
  collateral: bigint,
  normalizedDebt: bigint,
  rate: bigint,
  spot: bigint,
  mat: bigint,
): VaultInfo {
  // Calculate actual debt = normalizedDebt * rate
  const debt = rmul(normalizedDebt, rate);
  const debtWad = rayToWad(debt);

  // Calculate collateral value = collateral * spot (spot already has safety margin)
  // Note: spot = price / liquidationRatio, so we need to reverse
  const collateralValue = wmul(collateral, rayToWad(rmul(spot, mat)));

  // Calculate collateral ratio
  const collateralRatio = calculateCollateralRatio(collateralValue, debtWad);

  // Get liquidation ratio as percentage
  const liquidationRatio = fromRay(mat) * 100;

  // Get vault status
  const status = getVaultStatus(collateralRatio, liquidationRatio);

  // Calculate liquidation price
  // liquidationPrice = debt * mat / collateral
  const liquidationPrice = collateral > 0n
    ? rayToWad(rmul(rdiv(wadToRay(debtWad), wadToRay(collateral)), mat))
    : 0n;

  // Calculate max withdraw
  const price = rdiv(spot, wadToRay(WAD));
  const maxWithdraw = calculateMaxWithdraw(collateral, debtWad, rayToWad(price), mat);

  // Calculate max debt
  const maxDebt = calculateMaxDebt(collateralValue, mat, debtWad);

  return {
    id: vaultId,
    owner,
    ilk,
    collateral,
    debt: debtWad,
    collateralRatio,
    liquidationPrice,
    status,
    maxWithdraw,
    maxDebt,
  };
}

/**
 * Check if vault can be liquidated
 */
export function isLiquidatable(
  collateral: bigint,
  debt: bigint,
  spot: bigint,
): boolean {
  // Vault is liquidatable if collateral * spot < debt
  const collateralValue = wmul(collateral, rayToWad(spot));
  return collateralValue < debt;
}

/**
 * Calculate health factor
 * healthFactor = (collateralValue * liquidationRatio) / debt
 */
export function calculateHealthFactor(
  collateral: bigint,
  debt: bigint,
  spot: bigint,
  mat: bigint,
): number {
  if (debt === 0n) return Infinity;
  const collateralValue = wmul(collateral, rayToWad(spot));
  const maxDebt = rayToWad(rdiv(wadToRay(collateralValue), mat));
  return Number(maxDebt) / Number(debt);
}

/**
 * Validate vault operation parameters
 */
export function validateVaultOperation(
  operation: 'deposit' | 'withdraw' | 'generate' | 'repay',
  amount: bigint,
  vault: VaultInfo,
  ilkParams: IlkParams,
): { valid: boolean; error?: string } {
  if (amount <= 0n) {
    return { valid: false, error: 'Amount must be positive' };
  }

  switch (operation) {
    case 'deposit':
      // Deposit is always valid if amount > 0
      return { valid: true };

    case 'withdraw':
      if (amount > vault.maxWithdraw) {
        return {
          valid: false,
          error: `Cannot withdraw ${formatAmount(amount)}. Maximum: ${formatAmount(vault.maxWithdraw)}`,
        };
      }
      return { valid: true };

    case 'generate':
      if (amount > vault.maxDebt) {
        return {
          valid: false,
          error: `Cannot generate ${formatAmount(amount)} USDS. Maximum: ${formatAmount(vault.maxDebt)}`,
        };
      }
      // Check dust limit
      const newDebt = vault.debt + amount;
      if (newDebt < radToWad(ilkParams.dust) && newDebt > 0n) {
        return {
          valid: false,
          error: `Debt must be at least ${formatAmount(radToWad(ilkParams.dust))} USDS (dust limit)`,
        };
      }
      return { valid: true };

    case 'repay':
      if (amount > vault.debt) {
        return {
          valid: false,
          error: `Cannot repay ${formatAmount(amount)} USDS. Current debt: ${formatAmount(vault.debt)}`,
        };
      }
      // Check dust limit for partial repayment
      const remainingDebt = vault.debt - amount;
      if (remainingDebt < radToWad(ilkParams.dust) && remainingDebt > 0n) {
        return {
          valid: false,
          error: `Remaining debt would be below dust limit. Repay in full or leave at least ${formatAmount(radToWad(ilkParams.dust))} USDS`,
        };
      }
      return { valid: true };

    default:
      return { valid: false, error: 'Unknown operation' };
  }
}

/**
 * Format vault for display
 */
export function formatVault(vault: VaultInfo): Record<string, string | number> {
  return {
    id: vault.id,
    owner: vault.owner,
    ilk: vault.ilk,
    collateral: formatAmount(vault.collateral),
    debt: formatAmount(vault.debt),
    collateralRatio: `${vault.collateralRatio.toFixed(2)}%`,
    liquidationPrice: `$${formatAmount(vault.liquidationPrice)}`,
    status: vault.status,
    maxWithdraw: formatAmount(vault.maxWithdraw),
    maxDebt: formatAmount(vault.maxDebt),
  };
}

/**
 * Generate unique vault identifier
 */
export function generateVaultUrn(cdpId: number, cdpManager: string): string {
  // In practice, this would be calculated from the CDP manager
  return `urn:vault:${cdpId}`;
}

/**
 * Parse vault ID from various formats
 */
export function parseVaultId(input: string | number): number {
  if (typeof input === 'number') return input;
  
  // Handle "vault:123" format
  if (input.startsWith('vault:')) {
    return parseInt(input.replace('vault:', ''), 10);
  }
  
  // Handle "#123" format
  if (input.startsWith('#')) {
    return parseInt(input.slice(1), 10);
  }
  
  // Handle plain number string
  return parseInt(input, 10);
}

/**
 * Check if address is valid Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Check if vault ID is valid
 */
export function isValidVaultId(vaultId: number): boolean {
  return Number.isInteger(vaultId) && vaultId > 0;
}
