/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Collateral Types (Ilks) for Sky Protocol
 * Each ilk represents a specific collateral type that can be used to generate USDS/DAI.
 */

export interface IlkInfo {
  ilk: string;
  name: string;
  symbol: string;
  token: string;
  join: string;
  gem: string;
  pip: string;
  decimals: number;
  category: 'crypto' | 'rwa' | 'lp' | 'stablecoin';
  description: string;
}

/**
 * Common collateral types on Ethereum Mainnet
 */
export const ILKS: Record<string, IlkInfo> = {
  'ETH-A': {
    ilk: 'ETH-A',
    name: 'Wrapped Ether',
    symbol: 'WETH',
    token: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    join: '0x2F0b23f53734252Bda2277357e97e1517d6B042A',
    gem: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    pip: '0x81FE72B5A8d1A857d176C3E7d5Bd2679A9B85763',
    decimals: 18,
    category: 'crypto',
    description: 'Wrapped Ether with standard risk parameters',
  },
  'ETH-B': {
    ilk: 'ETH-B',
    name: 'Wrapped Ether (High Risk)',
    symbol: 'WETH',
    token: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    join: '0x08638eF1A205bE6762A8b935F5da9b700Cf7322c',
    gem: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    pip: '0x81FE72B5A8d1A857d176C3E7d5Bd2679A9B85763',
    decimals: 18,
    category: 'crypto',
    description: 'Wrapped Ether with higher risk tolerance',
  },
  'ETH-C': {
    ilk: 'ETH-C',
    name: 'Wrapped Ether (Low Risk)',
    symbol: 'WETH',
    token: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    join: '0xF04a5cC80B1E94C69B48f5ee68a08CD2F09A7c3E',
    gem: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    pip: '0x81FE72B5A8d1A857d176C3E7d5Bd2679A9B85763',
    decimals: 18,
    category: 'crypto',
    description: 'Wrapped Ether with conservative risk parameters',
  },
  'WBTC-A': {
    ilk: 'WBTC-A',
    name: 'Wrapped Bitcoin',
    symbol: 'WBTC',
    token: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    join: '0xBF72Da2Bd84c5170618Fbe5914B0ECA9638d5eb5',
    gem: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    pip: '0xf185d0682d50819263941e5f4EacC763CC5C6C42',
    decimals: 8,
    category: 'crypto',
    description: 'Wrapped Bitcoin collateral',
  },
  'WBTC-B': {
    ilk: 'WBTC-B',
    name: 'Wrapped Bitcoin (High Risk)',
    symbol: 'WBTC',
    token: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    join: '0xfA8c996e158B80D77FbD0082BB437556A65B96E0',
    gem: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    pip: '0xf185d0682d50819263941e5f4EacC763CC5C6C42',
    decimals: 8,
    category: 'crypto',
    description: 'Wrapped Bitcoin with higher risk tolerance',
  },
  'WBTC-C': {
    ilk: 'WBTC-C',
    name: 'Wrapped Bitcoin (Low Risk)',
    symbol: 'WBTC',
    token: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    join: '0x7f62f9592b823331E012D3c5DdF2A7714CfB9de2',
    gem: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    pip: '0xf185d0682d50819263941e5f4EacC763CC5C6C42',
    decimals: 8,
    category: 'crypto',
    description: 'Wrapped Bitcoin with conservative risk parameters',
  },
  'WSTETH-A': {
    ilk: 'WSTETH-A',
    name: 'Wrapped Staked Ether',
    symbol: 'wstETH',
    token: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
    join: '0x10CD5fbe1b404B7E19Ef964B63939907bdaf42E2',
    gem: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
    pip: '0xFe7a2aC0B945f12089aEEB6eCebf4F384D9f043F',
    decimals: 18,
    category: 'crypto',
    description: 'Lido Wrapped Staked Ether collateral',
  },
  'WSTETH-B': {
    ilk: 'WSTETH-B',
    name: 'Wrapped Staked Ether (High Risk)',
    symbol: 'wstETH',
    token: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
    join: '0x248cCBf4864221fC0E840F29BB042ad5bFC89B5c',
    gem: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
    pip: '0xFe7a2aC0B945f12089aEEB6eCebf4F384D9f043F',
    decimals: 18,
    category: 'crypto',
    description: 'Lido Wrapped Staked Ether with higher risk tolerance',
  },
  'RETH-A': {
    ilk: 'RETH-A',
    name: 'Rocket Pool ETH',
    symbol: 'rETH',
    token: '0xae78736Cd615f374D3085123A210448E74Fc6393',
    join: '0xC6424e862f1462281B0a5FAc078e4b63006bDEBF',
    gem: '0xae78736Cd615f374D3085123A210448E74Fc6393',
    pip: '0xeE7F0b350aA119b3d05DC733a4621a81972f7D47',
    decimals: 18,
    category: 'crypto',
    description: 'Rocket Pool staked ETH collateral',
  },
  'GNO-A': {
    ilk: 'GNO-A',
    name: 'Gnosis',
    symbol: 'GNO',
    token: '0x6810e776880C02933D47DB1b9fc05908e5386b96',
    join: '0x7bD3f01e24E0f0838788bC8f573CEA43A80CaBB5',
    gem: '0x6810e776880C02933D47DB1b9fc05908e5386b96',
    pip: '0xd800ca44fFABecd159c7889c3bf64a217361AEc8',
    decimals: 18,
    category: 'crypto',
    description: 'Gnosis token collateral',
  },
  'LINK-A': {
    ilk: 'LINK-A',
    name: 'Chainlink',
    symbol: 'LINK',
    token: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    join: '0xdFccAf8fDbD2F4805C174f856a317765B49E4a50',
    gem: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    pip: '0x9B0C694C6939b5EA9584e9b61C7815E8d97D9cC7',
    decimals: 18,
    category: 'crypto',
    description: 'Chainlink token collateral',
  },
  'YFI-A': {
    ilk: 'YFI-A',
    name: 'yearn.finance',
    symbol: 'YFI',
    token: '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e',
    join: '0x3ff33d9162aD47660083D7DC4bC02Fb231c81677',
    gem: '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e',
    pip: '0x5F122465bCf86F45922036970Be6DD7F58820214',
    decimals: 18,
    category: 'crypto',
    description: 'yearn.finance governance token collateral',
  },
  'MATIC-A': {
    ilk: 'MATIC-A',
    name: 'Polygon',
    symbol: 'MATIC',
    token: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0',
    join: '0x885f16e177d45fC9e7C87e1DA9fd47A9cfcE8E13',
    gem: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0',
    pip: '0x8874964279302e6d4e523Fb1789981C39a1034Ba',
    decimals: 18,
    category: 'crypto',
    description: 'Polygon MATIC token collateral',
  },
  'PSM-USDC-A': {
    ilk: 'PSM-USDC-A',
    name: 'USDC PSM',
    symbol: 'USDC',
    token: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    join: '0x0A59649758aa4d66E25f08Dd01271e891fe52199',
    gem: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    pip: '0x77b68899b99b686F415d074278a9a16b336085A0',
    decimals: 6,
    category: 'stablecoin',
    description: 'USDC Peg Stability Module',
  },
  'PSM-PAX-A': {
    ilk: 'PSM-PAX-A',
    name: 'PAX PSM',
    symbol: 'USDP',
    token: '0x8E870D67F660D95d5be530380D0eC0bd388289E1',
    join: '0x7bbd8cA5e413bCa521C2c80D8d1908616894Cf21',
    gem: '0x8E870D67F660D95d5be530380D0eC0bd388289E1',
    pip: '0x043B963E1B2214eC90046167Ea29C109E3f8E5',
    decimals: 18,
    category: 'stablecoin',
    description: 'Pax Dollar Peg Stability Module',
  },
  'PSM-GUSD-A': {
    ilk: 'PSM-GUSD-A',
    name: 'GUSD PSM',
    symbol: 'GUSD',
    token: '0x056Fd409E1d7A124BD7017459dFEa2F387b6d5Cd',
    join: '0x79A0FA989fb7ADf1F8e80C93ee605Ebb94F7c',
    gem: '0x056Fd409E1d7A124BD7017459dFEa2F387b6d5Cd',
    pip: '0xf45Ae69CcA1b9B043dAE2C83A5B65Bc605BEc5F5',
    decimals: 2,
    category: 'stablecoin',
    description: 'Gemini Dollar Peg Stability Module',
  },
};

/**
 * Get ilk info by ilk name
 */
export function getIlkInfo(ilk: string): IlkInfo {
  const info = ILKS[ilk];
  if (!info) {
    throw new Error(`Unknown ilk: ${ilk}`);
  }
  return info;
}

/**
 * Get all ilks of a specific category
 */
export function getIlksByCategory(category: IlkInfo['category']): IlkInfo[] {
  return Object.values(ILKS).filter((ilk) => ilk.category === category);
}

/**
 * Get all ilk names
 */
export function getAllIlkNames(): string[] {
  return Object.keys(ILKS);
}

/**
 * Convert ilk string to bytes32
 */
export function ilkToBytes32(ilk: string): string {
  const hex = Buffer.from(ilk).toString('hex');
  return '0x' + hex.padEnd(64, '0');
}

/**
 * Convert bytes32 to ilk string
 */
export function bytes32ToIlk(bytes32: string): string {
  const hex = bytes32.replace('0x', '').replace(/0+$/, '');
  return Buffer.from(hex, 'hex').toString('utf8');
}
