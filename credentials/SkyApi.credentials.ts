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
 * Sky Protocol API Credentials
 * Provides configuration for Sky Protocol APIs and subgraph queries.
 */
export class SkyApi implements ICredentialType {
  name = 'skyApi';
  displayName = 'Sky API';
  documentationUrl = 'https://docs.sky.money';
  properties: INodeProperties[] = [
    {
      displayName: 'API Endpoint',
      name: 'apiEndpoint',
      type: 'string',
      default: 'https://api.sky.money',
      description: 'The Sky Protocol API endpoint',
    },
    {
      displayName: 'Subgraph URL',
      name: 'subgraphUrl',
      type: 'string',
      default: 'https://api.thegraph.com/subgraphs/name/sky-protocol/sky-mainnet',
      description: 'The Graph subgraph URL for querying Sky Protocol data',
    },
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'API key for authenticated endpoints (if applicable)',
    },
    {
      displayName: 'Graph API Key',
      name: 'graphApiKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'API key for The Graph (for decentralized subgraph queries)',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: '=Bearer {{$credentials.apiKey}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      method: 'POST',
      url: '={{$credentials.subgraphUrl}}',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: '{ _meta { block { number } } }',
      }),
    },
  };
}
