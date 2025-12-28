/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Sky Protocol Client
 * Main client for interacting with Sky Protocol smart contracts.
 */

import { ethers, JsonRpcProvider, Wallet, Contract, formatUnits, parseUnits } from 'ethers';
import { IExecuteFunctions, ILoadOptionsFunctions } from 'n8n-workflow';
import { getNetworkConfig, getRpcUrl, getChainId } from '../constants/networks';
import { getContractAddress, MAINNET_CONTRACTS } from '../constants/contracts';
import { WAD, RAY, fromWad, fromRay, toWad } from '../utils/mathUtils';

/**
 * Licensing notice for runtime logging
 */
const LICENSING_NOTICE = `[Velocity BPA Licensing Notice]

This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).

Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.

For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.`;

// Flag to track if license notice has been logged
let licenseNoticeLogged = false;

/**
 * Log licensing notice once per node load
 */
function logLicenseNotice(): void {
  if (!licenseNoticeLogged) {
    console.warn(LICENSING_NOTICE);
    licenseNoticeLogged = true;
  }
}

/**
 * ERC20 ABI for token operations
 */
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

/**
 * USDS Token ABI (extends ERC20 with minting/burning)
 */
const USDS_ABI = [
  ...ERC20_ABI,
  'function mint(address to, uint256 amount)',
  'function burn(address from, uint256 amount)',
];

/**
 * sUSDS (Savings USDS) ABI
 */
const SUSDS_ABI = [
  ...ERC20_ABI,
  'function deposit(uint256 assets, address receiver) returns (uint256 shares)',
  'function withdraw(uint256 assets, address receiver, address owner) returns (uint256 shares)',
  'function redeem(uint256 shares, address receiver, address owner) returns (uint256 assets)',
  'function convertToShares(uint256 assets) view returns (uint256)',
  'function convertToAssets(uint256 shares) view returns (uint256)',
  'function maxDeposit(address) view returns (uint256)',
  'function maxWithdraw(address owner) view returns (uint256)',
  'function previewDeposit(uint256 assets) view returns (uint256)',
  'function previewWithdraw(uint256 assets) view returns (uint256)',
  'function asset() view returns (address)',
  'function totalAssets() view returns (uint256)',
];

/**
 * Sky (SKY) Token ABI
 */
const SKY_ABI = [
  ...ERC20_ABI,
];

/**
 * DAI/USDS Migration ABI
 */
const MIGRATION_ABI = [
  'function daiToUsds(address usr, uint256 wad)',
  'function usdsToDai(address usr, uint256 wad)',
];

/**
 * MKR/SKY Migration ABI
 */
const MKR_SKY_MIGRATION_ABI = [
  'function mkrToSky(address usr, uint256 mkrAmt)',
  'function rate() view returns (uint256)',
];

/**
 * Vat (Core Accounting) ABI
 */
const VAT_ABI = [
  'function ilks(bytes32) view returns (uint256 Art, uint256 rate, uint256 spot, uint256 line, uint256 dust)',
  'function urns(bytes32, address) view returns (uint256 ink, uint256 art)',
  'function gem(bytes32, address) view returns (uint256)',
  'function dai(address) view returns (uint256)',
  'function sin(address) view returns (uint256)',
  'function debt() view returns (uint256)',
  'function vice() view returns (uint256)',
  'function Line() view returns (uint256)',
  'function live() view returns (uint256)',
];

/**
 * Pot (DSR - DAI Savings Rate) ABI
 */
const POT_ABI = [
  'function dsr() view returns (uint256)',
  'function chi() view returns (uint256)',
  'function rho() view returns (uint256)',
  'function pie(address) view returns (uint256)',
  'function Pie() view returns (uint256)',
  'function join(uint256 wad)',
  'function exit(uint256 wad)',
  'function drip() returns (uint256)',
];

/**
 * Jug (Stability Fees) ABI
 */
const JUG_ABI = [
  'function ilks(bytes32) view returns (uint256 duty, uint256 rho)',
  'function base() view returns (uint256)',
  'function drip(bytes32 ilk) returns (uint256)',
];

/**
 * Spot (Price Oracle) ABI
 */
const SPOT_ABI = [
  'function ilks(bytes32) view returns (address pip, uint256 mat)',
  'function par() view returns (uint256)',
  'function poke(bytes32 ilk)',
];

/**
 * Dog (Liquidations) ABI
 */
const DOG_ABI = [
  'function ilks(bytes32) view returns (address clip, uint256 chop, uint256 hole, uint256 dirt)',
  'function Hole() view returns (uint256)',
  'function Dirt() view returns (uint256)',
  'function bark(bytes32 ilk, address urn, address kpr) returns (uint256 id)',
];

/**
 * CDP Manager ABI
 */
const CDP_MANAGER_ABI = [
  'function cdpi() view returns (uint256)',
  'function urns(uint256) view returns (address)',
  'function list(uint256) view returns (uint256 prev, uint256 next)',
  'function owns(uint256) view returns (address)',
  'function ilks(uint256) view returns (bytes32)',
  'function first(address) view returns (uint256)',
  'function last(address) view returns (uint256)',
  'function count(address) view returns (uint256)',
  'function open(bytes32 ilk, address usr) returns (uint256)',
  'function give(uint256 cdp, address dst)',
  'function frob(uint256 cdp, int256 dink, int256 dart)',
  'function flux(uint256 cdp, address dst, uint256 wad)',
  'function move(uint256 cdp, address dst, uint256 rad)',
];

/**
 * PSM (Peg Stability Module) ABI
 */
const PSM_ABI = [
  'function gemJoin() view returns (address)',
  'function usdsJoin() view returns (address)',
  'function vow() view returns (address)',
  'function tin() view returns (uint256)',
  'function tout() view returns (uint256)',
  'function sellGem(address usr, uint256 gemAmt)',
  'function buyGem(address usr, uint256 gemAmt)',
];

/**
 * Flash Mint ABI
 */
const FLASH_MINT_ABI = [
  'function max() view returns (uint256)',
  'function toll() view returns (uint256)',
  'function vatUsdsJoin() view returns (address)',
  'function flashLoan(address receiver, address token, uint256 amount, bytes calldata data) returns (bool)',
];

/**
 * Governance Chief ABI
 */
const CHIEF_ABI = [
  'function hat() view returns (address)',
  'function GOV() view returns (address)',
  'function IOU() view returns (address)',
  'function approvals(address) view returns (uint256)',
  'function deposits(address) view returns (uint256)',
  'function lock(uint256 wad)',
  'function free(uint256 wad)',
  'function vote(address[] memory yays) returns (bytes32)',
  'function lift(address whom)',
];

/**
 * OSM (Oracle Security Module) ABI
 */
const OSM_ABI = [
  'function peek() view returns (bytes32, bool)',
  'function peep() view returns (bytes32, bool)',
  'function read() view returns (bytes32)',
  'function hop() view returns (uint16)',
  'function zzz() view returns (uint64)',
  'function src() view returns (address)',
];

/**
 * Median (Price Oracle) ABI
 */
const MEDIAN_ABI = [
  'function peek() view returns (bytes32, bool)',
  'function read() view returns (uint256)',
  'function age() view returns (uint32)',
  'function bar() view returns (uint256)',
  'function wat() view returns (bytes32)',
];

/**
 * Sky Protocol Client Configuration
 */
export interface SkyClientConfig {
  network: string;
  rpcUrl?: string;
  chainId?: number;
  privateKey?: string;
  subgraphUrl?: string;
}

/**
 * Sky Protocol Client
 */
export class SkyClient {
  private provider: JsonRpcProvider;
  private signer: Wallet | null = null;
  private network: string;
  private chainId: number;

  // Contract instances
  private contracts: Map<string, Contract> = new Map();

  constructor(config: SkyClientConfig) {
    logLicenseNotice();

    this.network = config.network;
    this.chainId = config.chainId || getChainId(config.network);

    const rpcUrl = config.rpcUrl || getRpcUrl(config.network);
    this.provider = new JsonRpcProvider(rpcUrl);

    if (config.privateKey) {
      this.signer = new Wallet(config.privateKey, this.provider);
    }
  }

  /**
   * Get provider instance
   */
  getProvider(): JsonRpcProvider {
    return this.provider;
  }

  /**
   * Get signer instance (throws if no private key)
   */
  getSigner(): Wallet {
    if (!this.signer) {
      throw new Error('No private key configured. Write operations require a private key.');
    }
    return this.signer;
  }

  /**
   * Check if client has signer
   */
  hasSigner(): boolean {
    return this.signer !== null;
  }

  /**
   * Get signer address
   */
  async getAddress(): Promise<string> {
    return this.getSigner().getAddress();
  }

  /**
   * Get contract instance
   */
  getContract(name: string, address: string, abi: string[]): Contract {
    const key = `${name}:${address}`;
    if (!this.contracts.has(key)) {
      const signerOrProvider = this.signer || this.provider;
      this.contracts.set(key, new Contract(address, abi, signerOrProvider));
    }
    return this.contracts.get(key)!;
  }

  // ===========================================
  // Token Operations
  // ===========================================

  /**
   * Get ERC20 token balance
   */
  async getTokenBalance(tokenAddress: string, address: string): Promise<bigint> {
    const contract = this.getContract('erc20', tokenAddress, ERC20_ABI);
    return await contract.balanceOf(address);
  }

  /**
   * Get ERC20 token info
   */
  async getTokenInfo(tokenAddress: string): Promise<{
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: bigint;
  }> {
    const contract = this.getContract('erc20', tokenAddress, ERC20_ABI);
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
      contract.totalSupply(),
    ]);
    return { name, symbol, decimals: Number(decimals), totalSupply };
  }

  /**
   * Transfer ERC20 tokens
   */
  async transferToken(
    tokenAddress: string,
    to: string,
    amount: bigint,
  ): Promise<string> {
    const contract = this.getContract('erc20', tokenAddress, ERC20_ABI);
    const tx = await contract.transfer(to, amount);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  /**
   * Approve ERC20 token spending
   */
  async approveToken(
    tokenAddress: string,
    spender: string,
    amount: bigint,
  ): Promise<string> {
    const contract = this.getContract('erc20', tokenAddress, ERC20_ABI);
    const tx = await contract.approve(spender, amount);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  /**
   * Get ERC20 allowance
   */
  async getAllowance(
    tokenAddress: string,
    owner: string,
    spender: string,
  ): Promise<bigint> {
    const contract = this.getContract('erc20', tokenAddress, ERC20_ABI);
    return await contract.allowance(owner, spender);
  }

  // ===========================================
  // USDS Operations
  // ===========================================

  /**
   * Get USDS balance
   */
  async getUsdsBalance(address: string): Promise<bigint> {
    return this.getTokenBalance(MAINNET_CONTRACTS.usds, address);
  }

  /**
   * Get USDS total supply
   */
  async getUsdsTotalSupply(): Promise<bigint> {
    const contract = this.getContract('usds', MAINNET_CONTRACTS.usds, USDS_ABI);
    return await contract.totalSupply();
  }

  // ===========================================
  // sUSDS Operations
  // ===========================================

  /**
   * Get sUSDS balance
   */
  async getSusdsBalance(address: string): Promise<bigint> {
    return this.getTokenBalance(MAINNET_CONTRACTS.susds, address);
  }

  /**
   * Deposit USDS to get sUSDS
   */
  async depositToSusds(amount: bigint): Promise<string> {
    const contract = this.getContract('susds', MAINNET_CONTRACTS.susds, SUSDS_ABI);
    const address = await this.getAddress();
    const tx = await contract.deposit(amount, address);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  /**
   * Withdraw USDS from sUSDS
   */
  async withdrawFromSusds(amount: bigint): Promise<string> {
    const contract = this.getContract('susds', MAINNET_CONTRACTS.susds, SUSDS_ABI);
    const address = await this.getAddress();
    const tx = await contract.withdraw(amount, address, address);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  /**
   * Get sUSDS exchange rate (shares to assets)
   */
  async getSusdsExchangeRate(): Promise<bigint> {
    const contract = this.getContract('susds', MAINNET_CONTRACTS.susds, SUSDS_ABI);
    // 1 share = X assets
    return await contract.convertToAssets(WAD);
  }

  /**
   * Convert USDS amount to sUSDS shares
   */
  async convertToSusdsShares(usdsAmount: bigint): Promise<bigint> {
    const contract = this.getContract('susds', MAINNET_CONTRACTS.susds, SUSDS_ABI);
    return await contract.convertToShares(usdsAmount);
  }

  /**
   * Convert sUSDS shares to USDS amount
   */
  async convertToUsdsAssets(susdsShares: bigint): Promise<bigint> {
    const contract = this.getContract('susds', MAINNET_CONTRACTS.susds, SUSDS_ABI);
    return await contract.convertToAssets(susdsShares);
  }

  // ===========================================
  // SKY Token Operations
  // ===========================================

  /**
   * Get SKY balance
   */
  async getSkyBalance(address: string): Promise<bigint> {
    return this.getTokenBalance(MAINNET_CONTRACTS.sky, address);
  }

  /**
   * Get SKY total supply
   */
  async getSkyTotalSupply(): Promise<bigint> {
    const contract = this.getContract('sky', MAINNET_CONTRACTS.sky, SKY_ABI);
    return await contract.totalSupply();
  }

  // ===========================================
  // DAI Operations (Legacy)
  // ===========================================

  /**
   * Get DAI balance
   */
  async getDaiBalance(address: string): Promise<bigint> {
    return this.getTokenBalance(MAINNET_CONTRACTS.dai, address);
  }

  /**
   * Get DSR (DAI Savings Rate)
   */
  async getDsr(): Promise<bigint> {
    const contract = this.getContract('pot', MAINNET_CONTRACTS.pot, POT_ABI);
    return await contract.dsr();
  }

  /**
   * Get DSR chi (accumulated rate)
   */
  async getDsrChi(): Promise<bigint> {
    const contract = this.getContract('pot', MAINNET_CONTRACTS.pot, POT_ABI);
    return await contract.chi();
  }

  // ===========================================
  // Migration Operations
  // ===========================================

  /**
   * Migrate DAI to USDS
   */
  async migrateDaiToUsds(amount: bigint): Promise<string> {
    const contract = this.getContract('daiUsds', MAINNET_CONTRACTS.daiUsds, MIGRATION_ABI);
    const address = await this.getAddress();
    const tx = await contract.daiToUsds(address, amount);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  /**
   * Migrate USDS back to DAI
   */
  async migrateUsdsToDai(amount: bigint): Promise<string> {
    const contract = this.getContract('daiUsds', MAINNET_CONTRACTS.daiUsds, MIGRATION_ABI);
    const address = await this.getAddress();
    const tx = await contract.usdsToDai(address, amount);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  /**
   * Migrate MKR to SKY
   */
  async migrateMkrToSky(amount: bigint): Promise<string> {
    const contract = this.getContract('mkrSky', MAINNET_CONTRACTS.mkrSky, MKR_SKY_MIGRATION_ABI);
    const address = await this.getAddress();
    const tx = await contract.mkrToSky(address, amount);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  /**
   * Get MKR to SKY rate
   */
  async getMkrToSkyRate(): Promise<bigint> {
    const contract = this.getContract('mkrSky', MAINNET_CONTRACTS.mkrSky, MKR_SKY_MIGRATION_ABI);
    return await contract.rate();
  }

  // ===========================================
  // Vault Operations
  // ===========================================

  /**
   * Get ilk (collateral type) info from Vat
   */
  async getVatIlk(ilkBytes32: string): Promise<{
    Art: bigint;
    rate: bigint;
    spot: bigint;
    line: bigint;
    dust: bigint;
  }> {
    const contract = this.getContract('vat', MAINNET_CONTRACTS.vat, VAT_ABI);
    const result = await contract.ilks(ilkBytes32);
    return {
      Art: result[0],
      rate: result[1],
      spot: result[2],
      line: result[3],
      dust: result[4],
    };
  }

  /**
   * Get vault (urn) info from Vat
   */
  async getVatUrn(ilkBytes32: string, urn: string): Promise<{
    ink: bigint;
    art: bigint;
  }> {
    const contract = this.getContract('vat', MAINNET_CONTRACTS.vat, VAT_ABI);
    const result = await contract.urns(ilkBytes32, urn);
    return {
      ink: result[0],
      art: result[1],
    };
  }

  /**
   * Get total system debt
   */
  async getTotalDebt(): Promise<bigint> {
    const contract = this.getContract('vat', MAINNET_CONTRACTS.vat, VAT_ABI);
    return await contract.debt();
  }

  /**
   * Get global debt ceiling
   */
  async getGlobalDebtCeiling(): Promise<bigint> {
    const contract = this.getContract('vat', MAINNET_CONTRACTS.vat, VAT_ABI);
    return await contract.Line();
  }

  /**
   * Get CDP count
   */
  async getCdpCount(): Promise<bigint> {
    const contract = this.getContract('cdpManager', MAINNET_CONTRACTS.cdpManager, CDP_MANAGER_ABI);
    return await contract.cdpi();
  }

  /**
   * Get vault owner
   */
  async getVaultOwner(cdpId: number): Promise<string> {
    const contract = this.getContract('cdpManager', MAINNET_CONTRACTS.cdpManager, CDP_MANAGER_ABI);
    return await contract.owns(cdpId);
  }

  /**
   * Get vault ilk
   */
  async getVaultIlk(cdpId: number): Promise<string> {
    const contract = this.getContract('cdpManager', MAINNET_CONTRACTS.cdpManager, CDP_MANAGER_ABI);
    return await contract.ilks(cdpId);
  }

  /**
   * Get vault urn address
   */
  async getVaultUrn(cdpId: number): Promise<string> {
    const contract = this.getContract('cdpManager', MAINNET_CONTRACTS.cdpManager, CDP_MANAGER_ABI);
    return await contract.urns(cdpId);
  }

  /**
   * Get vaults by owner
   */
  async getVaultsByOwner(owner: string): Promise<number[]> {
    const contract = this.getContract('cdpManager', MAINNET_CONTRACTS.cdpManager, CDP_MANAGER_ABI);
    
    const count = await contract.count(owner);
    if (count === 0n) return [];

    const vaults: number[] = [];
    let cdpId = await contract.first(owner);
    
    while (cdpId > 0n) {
      vaults.push(Number(cdpId));
      const list = await contract.list(cdpId);
      cdpId = list[1]; // next
    }

    return vaults;
  }

  // ===========================================
  // Stability Fee Operations
  // ===========================================

  /**
   * Get stability fee info for ilk
   */
  async getJugIlk(ilkBytes32: string): Promise<{
    duty: bigint;
    rho: bigint;
  }> {
    const contract = this.getContract('jug', MAINNET_CONTRACTS.jug, JUG_ABI);
    const result = await contract.ilks(ilkBytes32);
    return {
      duty: result[0],
      rho: result[1],
    };
  }

  /**
   * Get base stability fee rate
   */
  async getBaseRate(): Promise<bigint> {
    const contract = this.getContract('jug', MAINNET_CONTRACTS.jug, JUG_ABI);
    return await contract.base();
  }

  // ===========================================
  // Oracle Operations
  // ===========================================

  /**
   * Get spot info for ilk
   */
  async getSpotIlk(ilkBytes32: string): Promise<{
    pip: string;
    mat: bigint;
  }> {
    const contract = this.getContract('spot', MAINNET_CONTRACTS.spot, SPOT_ABI);
    const result = await contract.ilks(ilkBytes32);
    return {
      pip: result[0],
      mat: result[1],
    };
  }

  /**
   * Get OSM current price
   */
  async getOsmPrice(osmAddress: string): Promise<{
    price: bigint;
    valid: boolean;
  }> {
    const contract = this.getContract('osm', osmAddress, OSM_ABI);
    const result = await contract.peek();
    return {
      price: BigInt(result[0]),
      valid: result[1],
    };
  }

  /**
   * Get OSM next price
   */
  async getOsmNextPrice(osmAddress: string): Promise<{
    price: bigint;
    valid: boolean;
  }> {
    const contract = this.getContract('osm', osmAddress, OSM_ABI);
    const result = await contract.peep();
    return {
      price: BigInt(result[0]),
      valid: result[1],
    };
  }

  /**
   * Get median price
   */
  async getMedianPrice(medianAddress: string): Promise<bigint> {
    const contract = this.getContract('median', medianAddress, MEDIAN_ABI);
    return await contract.read();
  }

  // ===========================================
  // Liquidation Operations
  // ===========================================

  /**
   * Get dog (liquidation) info for ilk
   */
  async getDogIlk(ilkBytes32: string): Promise<{
    clip: string;
    chop: bigint;
    hole: bigint;
    dirt: bigint;
  }> {
    const contract = this.getContract('dog', MAINNET_CONTRACTS.dog, DOG_ABI);
    const result = await contract.ilks(ilkBytes32);
    return {
      clip: result[0],
      chop: result[1],
      hole: result[2],
      dirt: result[3],
    };
  }

  /**
   * Get global hole (max DAI in auction)
   */
  async getGlobalHole(): Promise<bigint> {
    const contract = this.getContract('dog', MAINNET_CONTRACTS.dog, DOG_ABI);
    return await contract.Hole();
  }

  // ===========================================
  // PSM Operations
  // ===========================================

  /**
   * Get PSM info
   */
  async getPsmInfo(psmAddress: string): Promise<{
    gemJoin: string;
    usdsJoin: string;
    tin: bigint;
    tout: bigint;
  }> {
    const contract = this.getContract('psm', psmAddress, PSM_ABI);
    const [gemJoin, usdsJoin, tin, tout] = await Promise.all([
      contract.gemJoin(),
      contract.usdsJoin(),
      contract.tin(),
      contract.tout(),
    ]);
    return { gemJoin, usdsJoin, tin, tout };
  }

  /**
   * Swap gem to USDS via PSM
   */
  async psmSellGem(psmAddress: string, gemAmount: bigint): Promise<string> {
    const contract = this.getContract('psm', psmAddress, PSM_ABI);
    const address = await this.getAddress();
    const tx = await contract.sellGem(address, gemAmount);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  /**
   * Swap USDS to gem via PSM
   */
  async psmBuyGem(psmAddress: string, gemAmount: bigint): Promise<string> {
    const contract = this.getContract('psm', psmAddress, PSM_ABI);
    const address = await this.getAddress();
    const tx = await contract.buyGem(address, gemAmount);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  // ===========================================
  // Flash Mint Operations
  // ===========================================

  /**
   * Get flash mint max amount
   */
  async getFlashMintMax(): Promise<bigint> {
    const contract = this.getContract('flashMint', MAINNET_CONTRACTS.flashMint, FLASH_MINT_ABI);
    return await contract.max();
  }

  /**
   * Get flash mint fee
   */
  async getFlashMintFee(): Promise<bigint> {
    const contract = this.getContract('flashMint', MAINNET_CONTRACTS.flashMint, FLASH_MINT_ABI);
    return await contract.toll();
  }

  // ===========================================
  // Governance Operations
  // ===========================================

  /**
   * Get current hat (active executive spell)
   */
  async getHat(): Promise<string> {
    const contract = this.getContract('chief', MAINNET_CONTRACTS.chief, CHIEF_ABI);
    return await contract.hat();
  }

  /**
   * Get governance token address
   */
  async getGovernanceToken(): Promise<string> {
    const contract = this.getContract('chief', MAINNET_CONTRACTS.chief, CHIEF_ABI);
    return await contract.GOV();
  }

  /**
   * Get approval votes for address
   */
  async getApprovals(address: string): Promise<bigint> {
    const contract = this.getContract('chief', MAINNET_CONTRACTS.chief, CHIEF_ABI);
    return await contract.approvals(address);
  }

  /**
   * Get deposited governance tokens
   */
  async getDeposits(address: string): Promise<bigint> {
    const contract = this.getContract('chief', MAINNET_CONTRACTS.chief, CHIEF_ABI);
    return await contract.deposits(address);
  }

  // ===========================================
  // Utility Methods
  // ===========================================

  /**
   * Get current block number
   */
  async getBlockNumber(): Promise<number> {
    return await this.provider.getBlockNumber();
  }

  /**
   * Get ETH balance
   */
  async getEthBalance(address: string): Promise<bigint> {
    return await this.provider.getBalance(address);
  }

  /**
   * Estimate gas for transaction
   */
  async estimateGas(tx: ethers.TransactionRequest): Promise<bigint> {
    return await this.provider.estimateGas(tx);
  }

  /**
   * Get gas price
   */
  async getGasPrice(): Promise<bigint> {
    const feeData = await this.provider.getFeeData();
    return feeData.gasPrice || 0n;
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(txHash: string, confirmations: number = 1): Promise<ethers.TransactionReceipt | null> {
    return await this.provider.waitForTransaction(txHash, confirmations);
  }
}

/**
 * Create Sky client from n8n credentials
 */
export async function createSkyClient(
  context: IExecuteFunctions | ILoadOptionsFunctions,
  credentialsName: string = 'skyNetwork',
): Promise<SkyClient> {
  const credentials = await context.getCredentials(credentialsName);

  const network = credentials.network as string;
  const rpcUrl = network === 'custom' ? (credentials.rpcUrl as string) : undefined;
  const chainId = network === 'custom' ? (credentials.chainId as number) : undefined;
  const privateKey = credentials.privateKey as string;
  const subgraphUrl = credentials.subgraphUrl as string;

  return new SkyClient({
    network,
    rpcUrl,
    chainId,
    privateKey: privateKey || undefined,
    subgraphUrl: subgraphUrl || undefined,
  });
}
