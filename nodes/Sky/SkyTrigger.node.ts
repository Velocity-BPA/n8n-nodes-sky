/**
 * @license
 * Business Source License 1.1
 * Copyright (c) 2024 Velocity BPA
 * Licensed under the BSL 1.1 - Commercial use requires a license from Velocity BPA.
 * See LICENSE file for details.
 *
 * [Velocity BPA Licensing Notice]
 *
 * This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
 *
 * Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
 *
 * For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.
 */

import {
	IPollFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
} from 'n8n-workflow';

import { ethers, Contract } from 'ethers';
import { getContractAddress } from './constants/contracts';

// Emit licensing notice once
let licensingNoticeEmitted = false;
function emitLicensingNotice(): void {
	if (!licensingNoticeEmitted) {
		console.warn(`
[Velocity BPA Licensing Notice]

This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).

Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.

For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.
`);
		licensingNoticeEmitted = true;
	}
}

// Event ABIs for monitoring
const TRANSFER_EVENT_ABI = ['event Transfer(address indexed from, address indexed to, uint256 value)'];
const DEPOSIT_EVENT_ABI = ['event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares)'];
const WITHDRAW_EVENT_ABI = ['event Withdraw(address indexed sender, address indexed receiver, address indexed owner, uint256 assets, uint256 shares)'];
const BARK_EVENT_ABI = ['event Bark(bytes32 indexed ilk, address indexed urn, uint256 ink, uint256 art, uint256 due, address clip, uint256 id)'];
const ETCH_EVENT_ABI = ['event Etch(bytes32 indexed slate)'];

export class SkyTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Sky Trigger',
		name: 'skyTrigger',
		icon: 'file:sky.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Trigger on Sky Protocol events - transfers, deposits, liquidations, governance',
		defaults: {
			name: 'Sky Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'skyNetwork',
				required: true,
			},
		],
		polling: true,
		properties: [
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				noDataExpression: true,
				options: [
					// Token Events
					{ name: 'USDS Transfer', value: 'usdsTransfer', description: 'USDS token transfers' },
					{ name: 'sUSDS Deposit', value: 'susdsDeposit', description: 'Deposits to sUSDS' },
					{ name: 'sUSDS Withdrawal', value: 'susdsWithdraw', description: 'Withdrawals from sUSDS' },
					{ name: 'SKY Transfer', value: 'skyTransfer', description: 'SKY token transfers' },
					{ name: 'DAI Transfer', value: 'daiTransfer', description: 'DAI token transfers' },

					// Liquidation Events
					{ name: 'Liquidation', value: 'liquidation', description: 'Vault liquidations (bark)' },

					// Governance Events
					{ name: 'Slate Created', value: 'slateCreated', description: 'New governance slates' },

					// Large Movements
					{ name: 'Large USDS Movement', value: 'largeUsdsMovement', description: 'Large USDS transfers' },
					{ name: 'Large SKY Movement', value: 'largeSkyMovement', description: 'Large SKY transfers' },
				],
				default: 'usdsTransfer',
			},

			// Filter by address
			{
				displayName: 'Filter By Address',
				name: 'filterAddress',
				type: 'string',
				default: '',
				placeholder: '0x...',
				description: 'Only trigger for events involving this address (optional)',
			},

			// Minimum amount for large movements
			{
				displayName: 'Minimum Amount',
				name: 'minAmount',
				type: 'string',
				default: '10000',
				description: 'Minimum amount for large movement triggers',
				displayOptions: {
					show: {
						event: ['largeUsdsMovement', 'largeSkyMovement'],
					},
				},
			},
		],
	};

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		emitLicensingNotice();

		const credentials = await this.getCredentials('skyNetwork');
		const event = this.getNodeParameter('event') as string;
		const filterAddress = this.getNodeParameter('filterAddress', '') as string;

		const rpcUrl = credentials.rpcUrl as string;
		const chainId = (credentials.chainId as number) || 1;

		const provider = new ethers.JsonRpcProvider(rpcUrl, chainId);

		// Get webhook data (state)
		const webhookData = this.getWorkflowStaticData('node') as IDataObject;
		const currentBlock = await provider.getBlockNumber();
		const lastBlock = (webhookData.lastBlock as number) || currentBlock - 100;

		// Don't process if no new blocks
		if (currentBlock <= lastBlock) {
			return null;
		}

		const events: INodeExecutionData[] = [];

		try {
			let contractAddress: string;
			let eventAbi: string[];
			let eventName: string;

			switch (event) {
				case 'usdsTransfer':
					contractAddress = getContractAddress('USDS', chainId);
					eventAbi = TRANSFER_EVENT_ABI;
					eventName = 'Transfer';
					break;

				case 'susdsDeposit':
					contractAddress = getContractAddress('sUSDS', chainId);
					eventAbi = DEPOSIT_EVENT_ABI;
					eventName = 'Deposit';
					break;

				case 'susdsWithdraw':
					contractAddress = getContractAddress('sUSDS', chainId);
					eventAbi = WITHDRAW_EVENT_ABI;
					eventName = 'Withdraw';
					break;

				case 'skyTransfer':
					contractAddress = getContractAddress('SKY', chainId);
					eventAbi = TRANSFER_EVENT_ABI;
					eventName = 'Transfer';
					break;

				case 'daiTransfer':
					contractAddress = getContractAddress('DAI', chainId);
					eventAbi = TRANSFER_EVENT_ABI;
					eventName = 'Transfer';
					break;

				case 'liquidation':
					contractAddress = getContractAddress('DOG', chainId);
					eventAbi = BARK_EVENT_ABI;
					eventName = 'Bark';
					break;

				case 'slateCreated':
					contractAddress = getContractAddress('CHIEF', chainId);
					eventAbi = ETCH_EVENT_ABI;
					eventName = 'Etch';
					break;

				case 'largeUsdsMovement':
					contractAddress = getContractAddress('USDS', chainId);
					eventAbi = TRANSFER_EVENT_ABI;
					eventName = 'Transfer';
					break;

				case 'largeSkyMovement':
					contractAddress = getContractAddress('SKY', chainId);
					eventAbi = TRANSFER_EVENT_ABI;
					eventName = 'Transfer';
					break;

				default:
					throw new Error(`Unknown event type: ${event}`);
			}

			const contract = new Contract(contractAddress, eventAbi, provider);
			const filter = contract.filters[eventName]();

			// Query events from last processed block to current
			const logs = await contract.queryFilter(filter, lastBlock + 1, currentBlock);

			for (const log of logs) {
				const parsedLog = contract.interface.parseLog({
					topics: log.topics as string[],
					data: log.data,
				});

				if (!parsedLog) continue;

				// Build event data
				const eventData: IDataObject = {
					event: eventName,
					blockNumber: log.blockNumber,
					transactionHash: log.transactionHash,
					logIndex: log.index,
					contractAddress,
					timestamp: new Date().toISOString(),
				};

				// Add parsed arguments
				parsedLog.args.forEach((arg: unknown, index: number) => {
					const name = parsedLog.fragment.inputs[index]?.name || `arg${index}`;
					if (typeof arg === 'bigint') {
						eventData[name] = arg.toString();
						if (name === 'value' || name === 'assets' || name === 'shares' || name === 'wad') {
							eventData[`${name}Formatted`] = ethers.formatUnits(arg, 18);
						}
					} else {
						eventData[name] = arg as string;
					}
				});

				// Apply address filter
				if (filterAddress) {
					const normalizedFilter = filterAddress.toLowerCase();
					const from = (eventData.from as string)?.toLowerCase();
					const to = (eventData.to as string)?.toLowerCase();
					const sender = (eventData.sender as string)?.toLowerCase();
					const owner = (eventData.owner as string)?.toLowerCase();
					const receiver = (eventData.receiver as string)?.toLowerCase();

					if (from !== normalizedFilter &&
						to !== normalizedFilter &&
						sender !== normalizedFilter &&
						owner !== normalizedFilter &&
						receiver !== normalizedFilter) {
						continue; // Skip this event
					}
				}

				// Apply minimum amount filter for large movements
				if (event === 'largeUsdsMovement' || event === 'largeSkyMovement') {
					const minAmount = this.getNodeParameter('minAmount', '10000') as string;
					const minAmountWei = ethers.parseUnits(minAmount, 18);
					const value = BigInt(eventData.value as string || '0');

					if (value < minAmountWei) {
						continue; // Skip small transfers
					}
				}

				events.push({ json: eventData });
			}

		} catch (error) {
			console.error('Error polling Sky events:', error);
		}

		// Update state
		webhookData.lastBlock = currentBlock;

		if (events.length === 0) {
			return null;
		}

		return [events];
	}
}
