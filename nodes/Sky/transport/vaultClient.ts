/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Vault Client for Sky Protocol
 * Specialized client for vault management operations.
 */

import { SkyClient } from './skyClient';
import { ilkToBytes32, bytes32ToIlk } from '../constants/ilks';
import { MAINNET_CONTRACTS } from '../constants/contracts';
import {
  VaultInfo,
  VaultStatus,
  IlkParams,
  calculateVaultInfo,
  isLiquidatable,
  calculateHealthFactor,
  validateVaultOperation,
  formatVault,
  parseVaultId,
  isValidAddress,
  isValidVaultId,
} from '../utils/vaultUtils';
import {
  WAD,
  RAY,
  fromWad,
  fromRay,
  formatAmount,
  toWad,
  wmul,
  wdiv,
  rmul,
  rdiv,
  wadToRay,
  rayToWad,
  radToWad,
  rateToApy,
} from '../utils/mathUtils';

/**
 * Vault creation result
 */
export interface VaultCreationResult {
  vaultId: number;
  ilk: string;
  owner: string;
  txHash: string;
}

/**
 * Vault operation result
 */
export interface VaultOperationResult {
  vaultId: number;
  operation: string;
  amount: bigint;
  txHash: string;
  newCollateral?: bigint;
  newDebt?: bigint;
}

/**
 * Full vault details
 */
export interface VaultDetails extends VaultInfo {
  ilkParams: IlkParams;
  healthFactor: number;
  collateralValue: bigint;
  stabilityFeeApy: number;
}

/**
 * Vault Client
 */
export class VaultClient {
  private skyClient: SkyClient;

  constructor(skyClient: SkyClient) {
    this.skyClient = skyClient;
  }

  /**
   * Get vault by ID
   */
  async getVault(vaultId: number): Promise<VaultDetails | null> {
    if (!isValidVaultId(vaultId)) {
      throw new Error('Invalid vault ID');
    }

    try {
      // Get vault basic info
      const owner = await this.skyClient.getVaultOwner(vaultId);
      const ilkBytes32 = await this.skyClient.getVaultIlk(vaultId);
      const urnAddress = await this.skyClient.getVaultUrn(vaultId);

      // Convert ilk bytes32 to string
      const ilk = bytes32ToIlk(ilkBytes32);

      // Get vault state from Vat
      const vatUrn = await this.skyClient.getVatUrn(ilkBytes32, urnAddress);

      // Get ilk parameters
      const vatIlk = await this.skyClient.getVatIlk(ilkBytes32);
      const jugIlk = await this.skyClient.getJugIlk(ilkBytes32);
      const spotIlk = await this.skyClient.getSpotIlk(ilkBytes32);
      const dogIlk = await this.skyClient.getDogIlk(ilkBytes32);

      // Calculate vault info
      const vaultInfo = calculateVaultInfo(
        vaultId,
        owner,
        ilk,
        vatUrn.ink,
        vatUrn.art,
        vatIlk.rate,
        vatIlk.spot,
        spotIlk.mat,
      );

      // Calculate additional details
      const healthFactor = calculateHealthFactor(
        vatUrn.ink,
        vaultInfo.debt,
        vatIlk.spot,
        spotIlk.mat,
      );

      const collateralPrice = rdiv(vatIlk.spot, wadToRay(WAD));
      const collateralValue = wmul(vatUrn.ink, rayToWad(rmul(collateralPrice, spotIlk.mat)));

      const stabilityFeeApy = rateToApy(jugIlk.duty);

      const ilkParams: IlkParams = {
        ilk,
        art: vatIlk.Art,
        rate: vatIlk.rate,
        spot: vatIlk.spot,
        line: vatIlk.line,
        dust: vatIlk.dust,
        mat: spotIlk.mat,
        duty: jugIlk.duty,
        chop: dogIlk.chop,
      };

      return {
        ...vaultInfo,
        ilkParams,
        healthFactor,
        collateralValue,
        stabilityFeeApy,
      };
    } catch (error) {
      // Vault doesn't exist or error fetching
      return null;
    }
  }

  /**
   * Get all vaults owned by an address
   */
  async getVaultsByOwner(owner: string): Promise<VaultDetails[]> {
    if (!isValidAddress(owner)) {
      throw new Error('Invalid owner address');
    }

    const vaultIds = await this.skyClient.getVaultsByOwner(owner);
    const vaults: VaultDetails[] = [];

    for (const vaultId of vaultIds) {
      const vault = await this.getVault(vaultId);
      if (vault) {
        vaults.push(vault);
      }
    }

    return vaults;
  }

  /**
   * Get vaults at risk of liquidation for a specific ilk
   */
  async getLiquidatableVaults(ilk: string, limit: number = 100): Promise<VaultDetails[]> {
    // Note: In production, this would query a subgraph for efficiency
    // For now, we'll return an empty array as this requires off-chain indexing
    console.warn('getLiquidatableVaults requires subgraph integration for efficiency');
    return [];
  }

  /**
   * Check if vault is liquidatable
   */
  async isVaultLiquidatable(vaultId: number): Promise<boolean> {
    const vault = await this.getVault(vaultId);
    if (!vault) return false;
    return vault.status === VaultStatus.LIQUIDATABLE;
  }

  /**
   * Get vault health summary
   */
  async getVaultHealthSummary(vaultId: number): Promise<{
    status: VaultStatus;
    healthFactor: number;
    collateralRatio: number;
    liquidationPrice: string;
    currentPrice: string;
    priceBuffer: string;
  }> {
    const vault = await this.getVault(vaultId);
    if (!vault) {
      throw new Error(`Vault ${vaultId} not found`);
    }

    const ilkBytes32 = ilkToBytes32(vault.ilk);
    const vatIlk = await this.skyClient.getVatIlk(ilkBytes32);
    const spotIlk = await this.skyClient.getSpotIlk(ilkBytes32);

    // Calculate current price from spot
    const currentPrice = rdiv(vatIlk.spot, wadToRay(WAD));
    const currentPriceNum = fromRay(rmul(currentPrice, spotIlk.mat));
    const liquidationPriceNum = fromWad(vault.liquidationPrice);
    const priceBuffer = ((currentPriceNum - liquidationPriceNum) / currentPriceNum) * 100;

    return {
      status: vault.status,
      healthFactor: vault.healthFactor,
      collateralRatio: vault.collateralRatio,
      liquidationPrice: `$${formatAmount(vault.liquidationPrice)}`,
      currentPrice: `$${currentPriceNum.toFixed(2)}`,
      priceBuffer: `${priceBuffer.toFixed(2)}%`,
    };
  }

  /**
   * Calculate maximum borrowable amount
   */
  async getMaxBorrowable(vaultId: number): Promise<{
    maxDebt: bigint;
    formatted: string;
  }> {
    const vault = await this.getVault(vaultId);
    if (!vault) {
      throw new Error(`Vault ${vaultId} not found`);
    }

    return {
      maxDebt: vault.maxDebt,
      formatted: formatAmount(vault.maxDebt),
    };
  }

  /**
   * Calculate maximum withdrawable collateral
   */
  async getMaxWithdrawable(vaultId: number): Promise<{
    maxWithdraw: bigint;
    formatted: string;
  }> {
    const vault = await this.getVault(vaultId);
    if (!vault) {
      throw new Error(`Vault ${vaultId} not found`);
    }

    return {
      maxWithdraw: vault.maxWithdraw,
      formatted: formatAmount(vault.maxWithdraw),
    };
  }

  /**
   * Simulate deposit operation
   */
  async simulateDeposit(
    vaultId: number,
    amount: bigint,
  ): Promise<{
    newCollateral: bigint;
    newCollateralRatio: number;
    newHealthFactor: number;
    newMaxDebt: bigint;
  }> {
    const vault = await this.getVault(vaultId);
    if (!vault) {
      throw new Error(`Vault ${vaultId} not found`);
    }

    const newCollateral = vault.collateral + amount;
    const ilkBytes32 = ilkToBytes32(vault.ilk);
    const vatIlk = await this.skyClient.getVatIlk(ilkBytes32);
    const spotIlk = await this.skyClient.getSpotIlk(ilkBytes32);

    const newVaultInfo = calculateVaultInfo(
      vaultId,
      vault.owner,
      vault.ilk,
      newCollateral,
      vault.ilkParams.art,
      vault.ilkParams.rate,
      vatIlk.spot,
      spotIlk.mat,
    );

    const newHealthFactor = calculateHealthFactor(
      newCollateral,
      vault.debt,
      vatIlk.spot,
      spotIlk.mat,
    );

    return {
      newCollateral,
      newCollateralRatio: newVaultInfo.collateralRatio,
      newHealthFactor,
      newMaxDebt: newVaultInfo.maxDebt,
    };
  }

  /**
   * Simulate borrow operation
   */
  async simulateBorrow(
    vaultId: number,
    amount: bigint,
  ): Promise<{
    newDebt: bigint;
    newCollateralRatio: number;
    newHealthFactor: number;
    newLiquidationPrice: bigint;
    valid: boolean;
    error?: string;
  }> {
    const vault = await this.getVault(vaultId);
    if (!vault) {
      throw new Error(`Vault ${vaultId} not found`);
    }

    // Validate operation
    const validation = validateVaultOperation('generate', amount, vault, vault.ilkParams);
    if (!validation.valid) {
      return {
        newDebt: vault.debt,
        newCollateralRatio: vault.collateralRatio,
        newHealthFactor: vault.healthFactor,
        newLiquidationPrice: vault.liquidationPrice,
        valid: false,
        error: validation.error,
      };
    }

    const newDebt = vault.debt + amount;
    const ilkBytes32 = ilkToBytes32(vault.ilk);
    const vatIlk = await this.skyClient.getVatIlk(ilkBytes32);
    const spotIlk = await this.skyClient.getSpotIlk(ilkBytes32);

    // Calculate new normalized art
    const newArt = rdiv(wadToRay(newDebt), vault.ilkParams.rate);

    const newVaultInfo = calculateVaultInfo(
      vaultId,
      vault.owner,
      vault.ilk,
      vault.collateral,
      rayToWad(newArt),
      vault.ilkParams.rate,
      vatIlk.spot,
      spotIlk.mat,
    );

    const newHealthFactor = calculateHealthFactor(
      vault.collateral,
      newDebt,
      vatIlk.spot,
      spotIlk.mat,
    );

    return {
      newDebt,
      newCollateralRatio: newVaultInfo.collateralRatio,
      newHealthFactor,
      newLiquidationPrice: newVaultInfo.liquidationPrice,
      valid: true,
    };
  }

  /**
   * Get ilk parameters
   */
  async getIlkParams(ilk: string): Promise<IlkParams> {
    const ilkBytes32 = ilkToBytes32(ilk);

    const [vatIlk, jugIlk, spotIlk, dogIlk] = await Promise.all([
      this.skyClient.getVatIlk(ilkBytes32),
      this.skyClient.getJugIlk(ilkBytes32),
      this.skyClient.getSpotIlk(ilkBytes32),
      this.skyClient.getDogIlk(ilkBytes32),
    ]);

    return {
      ilk,
      art: vatIlk.Art,
      rate: vatIlk.rate,
      spot: vatIlk.spot,
      line: vatIlk.line,
      dust: vatIlk.dust,
      mat: spotIlk.mat,
      duty: jugIlk.duty,
      chop: dogIlk.chop,
    };
  }

  /**
   * Get formatted ilk stats
   */
  async getIlkStats(ilk: string): Promise<{
    ilk: string;
    totalDebt: string;
    debtCeiling: string;
    utilization: string;
    stabilityFee: string;
    liquidationRatio: string;
    liquidationPenalty: string;
    dustLimit: string;
  }> {
    const params = await this.getIlkParams(ilk);

    const totalDebt = fromRay(params.art * params.rate);
    const debtCeiling = fromRay(params.line) / 1e18; // RAD to number
    const utilization = debtCeiling > 0 ? (totalDebt / debtCeiling) * 100 : 0;
    const stabilityFee = rateToApy(params.duty);
    const liquidationRatio = fromRay(params.mat) * 100;
    const liquidationPenalty = (fromWad(params.chop) - 1) * 100;
    const dustLimit = fromRay(params.dust) / 1e18; // RAD to number

    return {
      ilk,
      totalDebt: `$${totalDebt.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      debtCeiling: `$${debtCeiling.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      utilization: `${utilization.toFixed(2)}%`,
      stabilityFee: `${stabilityFee.toFixed(2)}%`,
      liquidationRatio: `${liquidationRatio.toFixed(0)}%`,
      liquidationPenalty: `${liquidationPenalty.toFixed(2)}%`,
      dustLimit: `$${dustLimit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    };
  }

  /**
   * Format vault for output
   */
  formatVault(vault: VaultDetails): Record<string, unknown> {
    return {
      ...formatVault(vault),
      healthFactor: vault.healthFactor.toFixed(4),
      collateralValue: formatAmount(vault.collateralValue),
      stabilityFeeApy: `${vault.stabilityFeeApy.toFixed(2)}%`,
    };
  }
}

/**
 * Create vault client from sky client
 */
export function createVaultClient(skyClient: SkyClient): VaultClient {
  return new VaultClient(skyClient);
}
