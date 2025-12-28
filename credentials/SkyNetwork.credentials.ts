/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

/**
 * Sky Protocol Network Credentials
 * Provides blockchain network configuration for interacting with Sky Protocol smart contracts.
 * Supports Ethereum Mainnet, Base, and custom endpoints.
 */
export class SkyNetwork implements ICredentialType {
  name = 'skyNetwork';
  displayName = 'Sky Network';
  documentationUrl = 'https://docs.sky.money';
  properties: INodeProperties[] = [
    {
      displayName: 'Network',
      name: 'network',
      type: 'options',
      default: 'mainnet',
      options: [
        {
          name: 'Ethereum Mainnet',
          value: 'mainnet',
        },
        {
          name: 'Base',
          value: 'base',
        },
        {
          name: 'Sepolia Testnet',
          value: 'sepolia',
        },
        {
          name: 'Custom',
          value: 'custom',
        },
      ],
      description: 'The blockchain network to connect to',
    },
    {
      displayName: 'RPC Endpoint URL',
      name: 'rpcUrl',
      type: 'string',
      default: '',
      placeholder: 'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
      description: 'The RPC endpoint URL for blockchain interactions. Required for custom networks.',
      displayOptions: {
        show: {
          network: ['custom'],
        },
      },
    },
    {
      displayName: 'Chain ID',
      name: 'chainId',
      type: 'number',
      default: 1,
      description: 'The chain ID for the custom network',
      displayOptions: {
        show: {
          network: ['custom'],
        },
      },
    },
    {
      displayName: 'Private Key',
      name: 'privateKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      placeholder: '0x...',
      description:
        'Private key for signing transactions. Required for write operations. Never share or expose this value.',
    },
    {
      displayName: 'Subgraph Endpoint',
      name: 'subgraphUrl',
      type: 'string',
      default: '',
      placeholder: 'https://api.thegraph.com/subgraphs/name/sky-protocol/sky',
      description: 'Optional custom subgraph endpoint for querying indexed data',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {},
  };

  test: ICredentialTestRequest = {
    request: {
      method: 'POST',
      url: '={{$credentials.network === "custom" ? $credentials.rpcUrl : ($credentials.network === "mainnet" ? "https://eth.llamarpc.com" : ($credentials.network === "base" ? "https://mainnet.base.org" : "https://rpc.sepolia.org"))}}',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_chainId',
        params: [],
        id: 1,
      }),
    },
  };
}
