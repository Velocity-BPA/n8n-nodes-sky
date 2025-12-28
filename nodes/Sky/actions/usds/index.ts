/**
 * @license
 * Business Source License 1.1
 * Copyright (c) 2024 Velocity BPA
 * Licensed under the BSL 1.1 - Commercial use requires a license from Velocity BPA.
 * See LICENSE file for details.
 */

import { INodeProperties } from 'n8n-workflow';

export const usdsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['usds'],
			},
		},
		options: [
			{
				name: 'Get Balance',
				value: 'getBalance',
				description: 'Get USDS balance for an address',
				action: 'Get USDS balance',
			},
			{
				name: 'Get Total Supply',
				value: 'getTotalSupply',
				description: 'Get total USDS supply',
				action: 'Get USDS total supply',
			},
			{
				name: 'Transfer',
				value: 'transfer',
				description: 'Transfer USDS to another address',
				action: 'Transfer USDS',
			},
			{
				name: 'Approve',
				value: 'approve',
				description: 'Approve USDS spending',
				action: 'Approve USDS spending',
			},
			{
				name: 'Get Allowance',
				value: 'getAllowance',
				description: 'Get spending allowance',
				action: 'Get USDS allowance',
			},
			{
				name: 'Get Price',
				value: 'getPrice',
				description: 'Get USDS price',
				action: 'Get USDS price',
			},
		],
		default: 'getBalance',
	},
];

export const usdsFields: INodeProperties[] = [
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		required: true,
		default: '',
		placeholder: '0x...',
		description: 'Ethereum address to check balance',
		displayOptions: {
			show: {
				resource: ['usds'],
				operation: ['getBalance', 'getAllowance'],
			},
		},
	},
	{
		displayName: 'Recipient',
		name: 'recipient',
		type: 'string',
		required: true,
		default: '',
		placeholder: '0x...',
		description: 'Recipient address for transfer',
		displayOptions: {
			show: {
				resource: ['usds'],
				operation: ['transfer'],
			},
		},
	},
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'string',
		required: true,
		default: '0',
		description: 'Amount in USDS (e.g., "100.5")',
		displayOptions: {
			show: {
				resource: ['usds'],
				operation: ['transfer', 'approve'],
			},
		},
	},
	{
		displayName: 'Spender',
		name: 'spender',
		type: 'string',
		required: true,
		default: '',
		placeholder: '0x...',
		description: 'Address to approve for spending',
		displayOptions: {
			show: {
				resource: ['usds'],
				operation: ['approve', 'getAllowance'],
			},
		},
	},
];
