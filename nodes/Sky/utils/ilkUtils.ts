/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Ilk (Collateral Type) Utilities for Sky Protocol
 * Helper functions for working with collateral types.
 */

import { ILKS, IlkInfo, ilkToBytes32, bytes32ToIlk } from '../constants/ilks';
import { fromRay, fromRad, rateToApy, formatAmount } from './mathUtils';

/**
 * Ilk parameters from the Vat contract
 */
export interface VatIlkData {
  Art: bigint; // Total normalized debt
  rate: bigint; // Accumulated rate (RAY)
  spot: bigint; // Price with safety margin (RAY)
  line: bigint; // Debt ceiling (RAD)
  dust: bigint; // Minimum debt (RAD)
}

/**
 * Ilk parameters from the Jug contract
 */
export interface JugIlkData {
  duty: bigint; // Stability fee rate per second (RAY)
  rho: bigint; // Last drip timestamp
}

/**
 * Ilk parameters from the Dog contract
 */
export interface DogIlkData {
  clip: string; // Clipper address
  chop: bigint; // Liquidation penalty (WAD)
  hole: bigint; // Max DAI to be auctioned (RAD)
  dirt: bigint; // Current DAI being auctioned (RAD)
}

/**
 * Ilk parameters from the Spot contract
 */
export interface SpotIlkData {
  pip: string; // Oracle address
  mat: bigint; // Liquidation ratio (RAY)
}

/**
 * Combined ilk information
 */
export interface FullIlkInfo extends IlkInfo {
  vat: VatIlkData;
  jug: JugIlkData;
  dog: DogIlkData;
  spot: SpotIlkData;
  stabilityFeeApy: number;
  liquidationRatioPercent: number;
  liquidationPenaltyPercent: number;
  debtCeiling: number;
  dustLimit: number;
  totalDebt: number;
  utilizationPercent: number;
}

/**
 * Get formatted ilk parameters for display
 */
export function formatIlkParams(
  ilkInfo: IlkInfo,
  vat: VatIlkData,
  jug: JugIlkData,
  dog: DogIlkData,
  spot: SpotIlkData,
): FullIlkInfo {
  // Calculate stability fee APY from duty
  const stabilityFeeApy = rateToApy(jug.duty);

  // Calculate liquidation ratio percentage
  const liquidationRatioPercent = fromRay(spot.mat) * 100;

  // Calculate liquidation penalty percentage
  const liquidationPenaltyPercent = (Number(dog.chop) / 1e18 - 1) * 100;

  // Calculate debt ceiling in human-readable format
  const debtCeiling = fromRad(vat.line);

  // Calculate dust limit
  const dustLimit = fromRad(vat.dust);

  // Calculate total debt
  const totalDebt = fromRay(vat.Art * vat.rate);

  // Calculate utilization
  const utilizationPercent = debtCeiling > 0 ? (totalDebt / debtCeiling) * 100 : 0;

  return {
    ...ilkInfo,
    vat,
    jug,
    dog,
    spot,
    stabilityFeeApy,
    liquidationRatioPercent,
    liquidationPenaltyPercent,
    debtCeiling,
    dustLimit,
    totalDebt,
    utilizationPercent,
  };
}

/**
 * Check if ilk has available debt capacity
 */
export function hasDebtCapacity(vat: VatIlkData): boolean {
  const totalDebt = vat.Art * vat.rate;
  return totalDebt < vat.line;
}

/**
 * Calculate available debt capacity
 */
export function getAvailableDebtCapacity(vat: VatIlkData): bigint {
  const totalDebt = vat.Art * vat.rate;
  if (totalDebt >= vat.line) return 0n;
  return vat.line - totalDebt;
}

/**
 * Check if debt amount meets dust requirement
 */
export function meetsDebtDust(amount: bigint, dust: bigint): boolean {
  return amount === 0n || amount >= dust;
}

/**
 * Get ilk risk level based on parameters
 */
export function getIlkRiskLevel(
  stabilityFee: number,
  liquidationRatio: number,
): 'low' | 'medium' | 'high' {
  // Higher stability fee = higher risk
  // Lower liquidation ratio = higher risk
  
  if (liquidationRatio >= 175 && stabilityFee <= 2) {
    return 'low';
  }
  
  if (liquidationRatio >= 150 && stabilityFee <= 5) {
    return 'medium';
  }
  
  return 'high';
}

/**
 * Format ilk for display
 */
export function formatIlkDisplay(info: FullIlkInfo): Record<string, string | number> {
  return {
    ilk: info.ilk,
    name: info.name,
    symbol: info.symbol,
    category: info.category,
    stabilityFee: `${info.stabilityFeeApy.toFixed(2)}%`,
    liquidationRatio: `${info.liquidationRatioPercent.toFixed(0)}%`,
    liquidationPenalty: `${info.liquidationPenaltyPercent.toFixed(2)}%`,
    debtCeiling: `$${info.debtCeiling.toLocaleString()}`,
    dustLimit: `$${info.dustLimit.toLocaleString()}`,
    totalDebt: `$${info.totalDebt.toLocaleString()}`,
    utilization: `${info.utilizationPercent.toFixed(2)}%`,
  };
}

/**
 * Compare ilks by stability fee
 */
export function compareByStabilityFee(a: FullIlkInfo, b: FullIlkInfo): number {
  return a.stabilityFeeApy - b.stabilityFeeApy;
}

/**
 * Compare ilks by liquidation ratio
 */
export function compareByLiquidationRatio(a: FullIlkInfo, b: FullIlkInfo): number {
  return a.liquidationRatioPercent - b.liquidationRatioPercent;
}

/**
 * Filter ilks by category
 */
export function filterIlksByCategory(
  ilks: FullIlkInfo[],
  category: IlkInfo['category'],
): FullIlkInfo[] {
  return ilks.filter((ilk) => ilk.category === category);
}

/**
 * Get best ilk for a given collateral (lowest stability fee)
 */
export function getBestIlkForCollateral(
  ilks: FullIlkInfo[],
  symbol: string,
): FullIlkInfo | undefined {
  const matching = ilks.filter((ilk) => ilk.symbol === symbol);
  if (matching.length === 0) return undefined;
  return matching.sort(compareByStabilityFee)[0];
}

/**
 * Check if ilk is a PSM (Peg Stability Module)
 */
export function isPsmIlk(ilk: string): boolean {
  return ilk.startsWith('PSM-');
}

/**
 * Get PSM stablecoin from ilk name
 */
export function getPsmStablecoin(ilk: string): string | null {
  if (!isPsmIlk(ilk)) return null;
  // PSM-USDC-A -> USDC
  const parts = ilk.split('-');
  return parts.length >= 2 ? parts[1] : null;
}

/**
 * Validate ilk name format
 */
export function isValidIlkName(ilk: string): boolean {
  // Valid format: TOKEN-VARIANT (e.g., ETH-A, WBTC-B, PSM-USDC-A)
  return /^[A-Z0-9]+-[A-Z]$/.test(ilk) || /^PSM-[A-Z]+-[A-Z]$/.test(ilk);
}

/**
 * Get ilk variant (A, B, C, etc.)
 */
export function getIlkVariant(ilk: string): string | null {
  const parts = ilk.split('-');
  return parts.length >= 2 ? parts[parts.length - 1] : null;
}

/**
 * Get base token from ilk name
 */
export function getIlkBaseToken(ilk: string): string | null {
  const parts = ilk.split('-');
  if (parts.length === 0) return null;
  if (isPsmIlk(ilk) && parts.length >= 3) {
    return parts[1];
  }
  return parts[0];
}

// Re-export bytes32 utilities
export { ilkToBytes32, bytes32ToIlk };
