/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Math Utilities for Sky Protocol
 * Handles fixed-point arithmetic with WAD, RAY, and RAD precision.
 *
 * WAD = 10^18 (used for token amounts)
 * RAY = 10^27 (used for rates and ratios)
 * RAD = 10^45 (used for system debt calculations)
 */

/**
 * Fixed-point precision constants
 */
export const WAD = 10n ** 18n; // 1e18
export const RAY = 10n ** 27n; // 1e27
export const RAD = 10n ** 45n; // 1e45

/**
 * Seconds per year (365 days)
 */
export const SECONDS_PER_YEAR = 365n * 24n * 60n * 60n;

/**
 * Convert a number to WAD (10^18)
 */
export function toWad(value: number | string): bigint {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return BigInt(Math.floor(numValue * 1e18));
}

/**
 * Convert WAD to a number
 */
export function fromWad(wad: bigint): number {
  return Number(wad) / 1e18;
}

/**
 * Convert WAD to a formatted string
 */
export function formatWad(wad: bigint, decimals: number = 6): string {
  return fromWad(wad).toFixed(decimals);
}

/**
 * Convert a number to RAY (10^27)
 */
export function toRay(value: number | string): bigint {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return BigInt(Math.floor(numValue * 1e27));
}

/**
 * Convert RAY to a number
 */
export function fromRay(ray: bigint): number {
  return Number(ray) / 1e27;
}

/**
 * Convert RAY to a formatted string
 */
export function formatRay(ray: bigint, decimals: number = 6): string {
  return fromRay(ray).toFixed(decimals);
}

/**
 * Convert a number to RAD (10^45)
 */
export function toRad(value: number | string): bigint {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return BigInt(Math.floor(numValue * 1e45));
}

/**
 * Convert RAD to a number
 */
export function fromRad(rad: bigint): number {
  return Number(rad) / 1e45;
}

/**
 * Convert RAD to a formatted string
 */
export function formatRad(rad: bigint, decimals: number = 6): string {
  return fromRad(rad).toFixed(decimals);
}

/**
 * Multiply two WAD values
 * Result = (a * b) / WAD
 */
export function wmul(a: bigint, b: bigint): bigint {
  return (a * b + WAD / 2n) / WAD;
}

/**
 * Divide two WAD values
 * Result = (a * WAD) / b
 */
export function wdiv(a: bigint, b: bigint): bigint {
  if (b === 0n) throw new Error('Division by zero');
  return (a * WAD + b / 2n) / b;
}

/**
 * Multiply two RAY values
 * Result = (a * b) / RAY
 */
export function rmul(a: bigint, b: bigint): bigint {
  return (a * b + RAY / 2n) / RAY;
}

/**
 * Divide two RAY values
 * Result = (a * RAY) / b
 */
export function rdiv(a: bigint, b: bigint): bigint {
  if (b === 0n) throw new Error('Division by zero');
  return (a * RAY + b / 2n) / b;
}

/**
 * Convert WAD to RAY
 */
export function wadToRay(wad: bigint): bigint {
  return wad * (RAY / WAD);
}

/**
 * Convert RAY to WAD (truncates)
 */
export function rayToWad(ray: bigint): bigint {
  return ray / (RAY / WAD);
}

/**
 * Convert WAD to RAD
 */
export function wadToRad(wad: bigint): bigint {
  return wad * (RAD / WAD);
}

/**
 * Convert RAD to WAD (truncates)
 */
export function radToWad(rad: bigint): bigint {
  return rad / (RAD / WAD);
}

/**
 * Convert RAY to RAD
 */
export function rayToRad(ray: bigint): bigint {
  return ray * (RAD / RAY);
}

/**
 * Convert RAD to RAY (truncates)
 */
export function radToRay(rad: bigint): bigint {
  return rad / (RAD / RAY);
}

/**
 * Calculate APY from per-second rate (RAY)
 * APY = (rate ^ secondsPerYear) - 1
 */
export function rateToApy(rate: bigint): number {
  const rateNum = fromRay(rate);
  const secondsPerYear = Number(SECONDS_PER_YEAR);
  return (Math.pow(rateNum, secondsPerYear) - 1) * 100;
}

/**
 * Calculate per-second rate from APY
 * Rate = (1 + APY)^(1/secondsPerYear)
 */
export function apyToRate(apy: number): bigint {
  const apyDecimal = apy / 100;
  const secondsPerYear = Number(SECONDS_PER_YEAR);
  const rate = Math.pow(1 + apyDecimal, 1 / secondsPerYear);
  return toRay(rate);
}

/**
 * Calculate collateral ratio
 * CR = (collateralValue / debtValue) * 100
 */
export function calculateCollateralRatio(
  collateralValue: bigint,
  debtValue: bigint,
): number {
  if (debtValue === 0n) return Infinity;
  return (Number(collateralValue) / Number(debtValue)) * 100;
}

/**
 * Calculate liquidation price
 * liquidationPrice = (debt * liquidationRatio) / collateralAmount
 */
export function calculateLiquidationPrice(
  debt: bigint,
  collateralAmount: bigint,
  liquidationRatio: bigint, // in RAY
): bigint {
  if (collateralAmount === 0n) return 0n;
  // debt is in RAD, convert to WAD first
  const debtWad = radToWad(debt);
  // liquidationRatio is in RAY, convert to WAD
  const liqRatioWad = rayToWad(liquidationRatio);
  // Calculate liquidation price
  return wmul(wdiv(debtWad, collateralAmount), liqRatioWad);
}

/**
 * Calculate maximum debt that can be generated
 * maxDebt = (collateralValue / liquidationRatio) - currentDebt
 */
export function calculateMaxDebt(
  collateralValue: bigint,
  liquidationRatio: bigint, // in RAY
  currentDebt: bigint,
): bigint {
  const maxTotalDebt = rdiv(wadToRay(collateralValue), liquidationRatio);
  const maxTotalDebtWad = rayToWad(maxTotalDebt);
  const available = maxTotalDebtWad - currentDebt;
  return available > 0n ? available : 0n;
}

/**
 * Calculate maximum collateral that can be withdrawn
 * maxWithdraw = collateral - (debt * liquidationRatio / price)
 */
export function calculateMaxWithdraw(
  collateral: bigint,
  debt: bigint,
  price: bigint,
  liquidationRatio: bigint, // in RAY
): bigint {
  if (debt === 0n) return collateral;
  const minCollateral = rmul(rdiv(wadToRay(debt), wadToRay(price)), liquidationRatio);
  const minCollateralWad = rayToWad(minCollateral);
  const available = collateral - minCollateralWad;
  return available > 0n ? available : 0n;
}

/**
 * Format a bigint with decimals
 */
export function formatAmount(
  amount: bigint,
  decimals: number = 18,
  displayDecimals: number = 6,
): string {
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const fraction = amount % divisor;
  const fractionStr = fraction.toString().padStart(decimals, '0').slice(0, displayDecimals);
  return `${whole}.${fractionStr}`;
}

/**
 * Parse a decimal string to bigint with specified decimals
 */
export function parseAmount(amount: string, decimals: number = 18): bigint {
  const [whole, fraction = ''] = amount.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole + paddedFraction);
}

/**
 * Check if a value is within safe bounds
 */
export function isSafeValue(value: bigint, max: bigint = 2n ** 128n - 1n): boolean {
  return value >= 0n && value <= max;
}

/**
 * Calculate accrued debt with stability fee
 * accruedDebt = debt * (currentRate / initialRate)
 */
export function calculateAccruedDebt(
  debt: bigint,
  currentRate: bigint,
  initialRate: bigint,
): bigint {
  if (initialRate === 0n) return debt;
  return rmul(debt, rdiv(currentRate, initialRate));
}
