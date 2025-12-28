/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Network configurations for Sky Protocol
 * Contains RPC endpoints, chain IDs, and subgraph URLs for supported networks.
 */

export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  subgraphUrl: string;
  explorerUrl: string;
  explorerApiUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const NETWORKS: Record<string, NetworkConfig> = {
  mainnet: {
    name: 'Ethereum Mainnet',
    chainId: 1,
    rpcUrl: 'https://eth.llamarpc.com',
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/sky-protocol/sky-mainnet',
    explorerUrl: 'https://etherscan.io',
    explorerApiUrl: 'https://api.etherscan.io/api',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  base: {
    name: 'Base',
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/sky-protocol/sky-base',
    explorerUrl: 'https://basescan.org',
    explorerApiUrl: 'https://api.basescan.org/api',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  sepolia: {
    name: 'Sepolia Testnet',
    chainId: 11155111,
    rpcUrl: 'https://rpc.sepolia.org',
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/sky-protocol/sky-sepolia',
    explorerUrl: 'https://sepolia.etherscan.io',
    explorerApiUrl: 'https://api-sepolia.etherscan.io/api',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
};

/**
 * Get network configuration by network key
 */
export function getNetworkConfig(network: string): NetworkConfig {
  const config = NETWORKS[network];
  if (!config) {
    throw new Error(`Unsupported network: ${network}`);
  }
  return config;
}

/**
 * Get RPC URL for a network, with optional custom override
 */
export function getRpcUrl(network: string, customRpcUrl?: string): string {
  if (network === 'custom' && customRpcUrl) {
    return customRpcUrl;
  }
  return getNetworkConfig(network).rpcUrl;
}

/**
 * Get chain ID for a network, with optional custom override
 */
export function getChainId(network: string, customChainId?: number): number {
  if (network === 'custom' && customChainId) {
    return customChainId;
  }
  return getNetworkConfig(network).chainId;
}
