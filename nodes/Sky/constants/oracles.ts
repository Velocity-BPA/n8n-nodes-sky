/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Oracle Configurations for Sky Protocol
 * Contains oracle addresses and configurations for price feeds.
 */

export interface OracleConfig {
  name: string;
  symbol: string;
  medianizer: string;
  osm: string;
  decimals: number;
  type: 'median' | 'osm' | 'dss-value' | 'chainlink';
}

/**
 * Oracle addresses for various assets on Ethereum Mainnet
 */
export const ORACLES: Record<string, OracleConfig> = {
  ETH: {
    name: 'Ethereum',
    symbol: 'ETH',
    medianizer: '0x64DE91F5A373Cd4c28de3600cB34C7C6cE410C85',
    osm: '0x81FE72B5A8d1A857d176C3E7d5Bd2679A9B85763',
    decimals: 18,
    type: 'osm',
  },
  WBTC: {
    name: 'Wrapped Bitcoin',
    symbol: 'WBTC',
    medianizer: '0xe0F30cb149fAADC7247E953746Be9BbBB6B5751f',
    osm: '0xf185d0682d50819263941e5f4EacC763CC5C6C42',
    decimals: 8,
    type: 'osm',
  },
  WSTETH: {
    name: 'Wrapped Staked Ether',
    symbol: 'wstETH',
    medianizer: '0x2F73b6567B866302e132273f67661fB89b5a66F2',
    osm: '0xFe7a2aC0B945f12089aEEB6eCebf4F384D9f043F',
    decimals: 18,
    type: 'osm',
  },
  RETH: {
    name: 'Rocket Pool ETH',
    symbol: 'rETH',
    medianizer: '0xF86360f0127f8A441Cfca332c75992D1C692b3D1',
    osm: '0xeE7F0b350aA119b3d05DC733a4621a81972f7D47',
    decimals: 18,
    type: 'osm',
  },
  GNO: {
    name: 'Gnosis',
    symbol: 'GNO',
    medianizer: '0x31BFA908637C29707e155Cfac3a50C9823bF8723',
    osm: '0xd800ca44fFABecd159c7889c3bf64a217361AEc8',
    decimals: 18,
    type: 'osm',
  },
  LINK: {
    name: 'Chainlink',
    symbol: 'LINK',
    medianizer: '0xbAd4212d73561B240f10C56F27e6D9608963f17b',
    osm: '0x9B0C694C6939b5EA9584e9b61C7815E8d97D9cC7',
    decimals: 18,
    type: 'osm',
  },
  YFI: {
    name: 'yearn.finance',
    symbol: 'YFI',
    medianizer: '0x89AC26C0aFCB28EC55B6CD2F6b7DAD867Fa24639',
    osm: '0x5F122465bCf86F45922036970Be6DD7F58820214',
    decimals: 18,
    type: 'osm',
  },
  MATIC: {
    name: 'Polygon',
    symbol: 'MATIC',
    medianizer: '0xfe1D93E2a5A5c8d3746F0E80b6F9F78c45F4d00C',
    osm: '0x8874964279302e6d4e523Fb1789981C39a1034Ba',
    decimals: 18,
    type: 'osm',
  },
  USDC: {
    name: 'USD Coin',
    symbol: 'USDC',
    medianizer: '0x77b68899b99b686F415d074278a9a16b336085A0',
    osm: '0x77b68899b99b686F415d074278a9a16b336085A0',
    decimals: 6,
    type: 'dss-value',
  },
};

/**
 * Oracle Security Module (OSM) delay in seconds
 * Prices are delayed by this amount before becoming active
 */
export const OSM_DELAY = 3600; // 1 hour

/**
 * Get oracle configuration for an asset
 */
export function getOracleConfig(symbol: string): OracleConfig {
  const config = ORACLES[symbol.toUpperCase()];
  if (!config) {
    throw new Error(`No oracle configuration for: ${symbol}`);
  }
  return config;
}

/**
 * Get medianizer address for an asset
 */
export function getMedianizerAddress(symbol: string): string {
  return getOracleConfig(symbol).medianizer;
}

/**
 * Get OSM address for an asset
 */
export function getOsmAddress(symbol: string): string {
  return getOracleConfig(symbol).osm;
}

/**
 * Check if oracle uses OSM (price delay)
 */
export function usesOsm(symbol: string): boolean {
  return getOracleConfig(symbol).type === 'osm';
}
