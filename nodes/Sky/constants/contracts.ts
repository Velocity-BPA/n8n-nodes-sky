/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Sky Protocol Contract Addresses
 * Contains all core contract addresses for the Sky Protocol ecosystem.
 * Includes both new Sky branding and legacy MakerDAO contracts.
 */

export interface ContractAddresses {
  // Core Sky Protocol (new)
  usds: string;
  susds: string;
  sky: string;

  // Legacy MakerDAO
  dai: string;
  sdai: string;
  mkr: string;

  // Core System
  vat: string;
  dog: string;
  pot: string;
  jug: string;
  spot: string;
  vow: string;
  cat: string;
  flap: string;
  flop: string;
  end: string;
  esm: string;

  // CDP/Vault Management
  cdpManager: string;
  proxyRegistry: string;
  dssProxyActions: string;

  // PSM (Peg Stability Module)
  psmUsdc: string;
  psmPax: string;
  psmGusd: string;

  // Flash Mint
  flashMint: string;
  dssFlash: string;

  // Governance
  chief: string;
  polling: string;
  pause: string;

  // Migration
  daiUsds: string;
  mkrSky: string;
  daiSdai: string;

  // Oracles
  median: string;
  osm: string;

  // Join Adapters
  daiJoin: string;
  usdsJoin: string;
  ethJoin: string;
  wbtcJoin: string;
  wstethJoin: string;
}

/**
 * Mainnet contract addresses
 */
export const MAINNET_CONTRACTS: ContractAddresses = {
  // Core Sky Protocol (new)
  usds: '0xdC035D45d973E3EC169d2276DDab16f1e407384F',
  susds: '0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD',
  sky: '0x56072C95FAA701256059aa122697B133aDEd9279',

  // Legacy MakerDAO
  dai: '0x6B175474E89094C44Da98b954EesC08111F',
  sdai: '0x83F20F44975D03b1b09e64809B757c47f942BEeA',
  mkr: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',

  // Core System
  vat: '0x35D1b3F3D7966A1DFe207aa4514C12a259A0492B',
  dog: '0x135954d155898D42C90D2a57824C690e0c7BEf1B',
  pot: '0x197E90f9FAD81970bA7976f33CbD77088E5D7cf7',
  jug: '0x19c0976f590D67707E62397C87829d896Dc0f1F1',
  spot: '0x65C79fcB50Ca1594B025960e539eD7A9a6D434A3',
  vow: '0xA950524441892A31ebddF91d3cEEFa04Bf454466',
  cat: '0x78F2c2AF65126834c51822F56Be0e7695A9F152c',
  flap: '0xd8a04F5412223F513DC55F839574430f5EC15531',
  flop: '0x0b84B0b4Eb20BdDe7c9F8D25d4EAbA9ac0b5c5A3',
  end: '0xaB14d3CE3F733CACB76eC2AbE7d2fcb00c99F3d5',
  esm: '0x09e05fF6142F2f9de8B6B65855A1d56B6cfE4c58',

  // CDP/Vault Management
  cdpManager: '0x5ef30b9986345249bc32d8928B7ee64DE9435E39',
  proxyRegistry: '0x4678f0a6958e4D2Bc4F1BAF7Bc52E8F3564f3fE4',
  dssProxyActions: '0x82ecD135Dce65Fbc6DbdD0e4237E0AF93FFD5038',

  // PSM (Peg Stability Module)
  psmUsdc: '0x89B78CfA322F6C5dE0aBcEecab66Aee45393cC5A',
  psmPax: '0x961Ae24a1Ceba861D1FDf723794f6024Dc5485Cf',
  psmGusd: '0x204659B2Fd2aD5723975c362Ce2230Fba11d3900',

  // Flash Mint
  flashMint: '0x1EB4CF3A948E7D72A198fe073cCb8C7a948cD853',
  dssFlash: '0x1EB4CF3A948E7D72A198fe073cCb8C7a948cD853',

  // Governance
  chief: '0x0a3f6849f78076aefaDf113F5BED87720274dDC0',
  polling: '0xD3A9FE267852281a1e6307a1C37CDfD76d39b133',
  pause: '0xbE286431454714F511008713973d3B053A2d38f3',

  // Migration
  daiUsds: '0x3225737a9Bbb6473CB4a45b7244ACa2BeFdB276A',
  mkrSky: '0xBDcFCA946b6CDd965f99a839e4435Bcdc1bc470B',
  daiSdai: '0x83F20F44975D03b1b09e64809B757c47f942BEeA',

  // Oracles
  median: '0x64DE91F5A373Cd4c28de3600cB34C7C6cE410C85',
  osm: '0x81FE72B5A8d1A857d176C3E7d5Bd2679A9B85763',

  // Join Adapters
  daiJoin: '0x9759A6Ac90977b93B58547b4A71c78317f391A28',
  usdsJoin: '0x0650CAF159C5A49f711e8169D4336ECB9b950275',
  ethJoin: '0x2F0b23f53734252Bda2277357e97e1517d6B042A',
  wbtcJoin: '0xBF72Da2Bd84c5170618Fbe5914B0ECA9638d5eb5',
  wstethJoin: '0x10CD5fbe1b404B7E19Ef964B63939907bdaf42E2',
};

/**
 * Base network contract addresses (placeholder - update when available)
 */
export const BASE_CONTRACTS: Partial<ContractAddresses> = {
  usds: '0x0000000000000000000000000000000000000000',
  susds: '0x0000000000000000000000000000000000000000',
  sky: '0x0000000000000000000000000000000000000000',
};

/**
 * Sepolia testnet contract addresses (placeholder - update when available)
 */
export const SEPOLIA_CONTRACTS: Partial<ContractAddresses> = {
  usds: '0x0000000000000000000000000000000000000000',
  susds: '0x0000000000000000000000000000000000000000',
  sky: '0x0000000000000000000000000000000000000000',
};

/**
 * Get contract addresses for a specific network
 */
export function getContractAddresses(network: string): ContractAddresses | Partial<ContractAddresses> {
  switch (network) {
    case 'mainnet':
      return MAINNET_CONTRACTS;
    case 'base':
      return BASE_CONTRACTS;
    case 'sepolia':
      return SEPOLIA_CONTRACTS;
    default:
      throw new Error(`Unsupported network for contracts: ${network}`);
  }
}

/**
 * Get a specific contract address for a network
 */
export function getContractAddress(contract: string, networkOrChainId: string | number = 1): string {
  // Convert contract name to lowercase for lookup
  const contractKey = contract.toLowerCase() as keyof ContractAddresses;

  // Convert chainId to network string if needed
  let network: string;
  if (typeof networkOrChainId === 'number') {
    switch (networkOrChainId) {
      case 1:
        network = 'mainnet';
        break;
      case 8453:
        network = 'base';
        break;
      case 11155111:
        network = 'sepolia';
        break;
      default:
        network = 'mainnet';
    }
  } else {
    network = networkOrChainId;
  }

  const addresses = getContractAddresses(network);
  const address = addresses[contractKey];
  if (!address || address === '0x0000000000000000000000000000000000000000') {
    throw new Error(`Contract ${contract} not available on network ${network}`);
  }
  return address;
}

/**
 * ERC20 Token Info
 */
export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
}

export const TOKEN_INFO: Record<string, TokenInfo> = {
  usds: {
    address: MAINNET_CONTRACTS.usds,
    symbol: 'USDS',
    name: 'Sky Dollar',
    decimals: 18,
  },
  susds: {
    address: MAINNET_CONTRACTS.susds,
    symbol: 'sUSDS',
    name: 'Savings USDS',
    decimals: 18,
  },
  sky: {
    address: MAINNET_CONTRACTS.sky,
    symbol: 'SKY',
    name: 'Sky',
    decimals: 18,
  },
  dai: {
    address: MAINNET_CONTRACTS.dai,
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
  },
  sdai: {
    address: MAINNET_CONTRACTS.sdai,
    symbol: 'sDAI',
    name: 'Savings Dai',
    decimals: 18,
  },
  mkr: {
    address: MAINNET_CONTRACTS.mkr,
    symbol: 'MKR',
    name: 'Maker',
    decimals: 18,
  },
};
