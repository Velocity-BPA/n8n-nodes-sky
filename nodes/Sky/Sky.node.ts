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
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	IDataObject,
} from 'n8n-workflow';

import { SkyClient } from './transport/skyClient';
import { VaultClient } from './transport/vaultClient';
import { GovernanceClient } from './transport/governanceClient';
import { SubgraphClient } from './transport/subgraphClient';
import * as mathUtils from './utils/mathUtils';
import { ILKS, getIlkInfo, ilkToBytes32 } from './constants/ilks';
import * as migrationUtils from './utils/migrationUtils';
import { getContractAddress } from './constants/contracts';
import { ORACLES } from './constants/oracles';
import { ethers } from 'ethers';

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

export class Sky implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Sky',
		name: 'sky',
		icon: 'file:sky.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Sky Protocol (formerly MakerDAO) - USDS, sUSDS, SKY, Vaults, PSM, Governance',
		defaults: {
			name: 'Sky',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'skyNetwork',
				required: true,
			},
			{
				name: 'skyApi',
				required: false,
			},
		],
		properties: [
			// Resource Selection
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'USDS', value: 'usds', description: 'Sky Dollar stablecoin operations' },
					{ name: 'sUSDS', value: 'susds', description: 'Savings USDS (yield-bearing)' },
					{ name: 'SKY Token', value: 'skyToken', description: 'SKY governance token' },
					{ name: 'DAI', value: 'dai', description: 'Legacy DAI stablecoin' },
					{ name: 'Vault', value: 'vault', description: 'CDP vault management' },
					{ name: 'Collateral', value: 'collateral', description: 'Collateral type information' },
					{ name: 'Oracle', value: 'oracle', description: 'Price feed operations' },
					{ name: 'Savings', value: 'savings', description: 'Sky Savings Rate (SSR)' },
					{ name: 'PSM', value: 'psm', description: 'Peg Stability Module' },
					{ name: 'Flash Mint', value: 'flashMint', description: 'Flash loan operations' },
					{ name: 'Governance', value: 'governance', description: 'Voting and proposals' },
					{ name: 'Migration', value: 'migration', description: 'DAI/MKR migration' },
					{ name: 'System', value: 'system', description: 'Protocol parameters' },
					{ name: 'Analytics', value: 'analytics', description: 'Protocol statistics' },
					{ name: 'Subgraph', value: 'subgraph', description: 'GraphQL queries' },
					{ name: 'Utility', value: 'utility', description: 'Math and conversion utilities' },
				],
				default: 'usds',
			},

			// ===================== Operation definitions =====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['usds'] } },
				options: [
					{ name: 'Get Balance', value: 'getBalance', action: 'Get USDS balance' },
					{ name: 'Get Total Supply', value: 'getTotalSupply', action: 'Get USDS total supply' },
					{ name: 'Transfer', value: 'transfer', action: 'Transfer USDS' },
					{ name: 'Approve', value: 'approve', action: 'Approve USDS spending' },
					{ name: 'Get Allowance', value: 'getAllowance', action: 'Get USDS allowance' },
				],
				default: 'getBalance',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['susds'] } },
				options: [
					{ name: 'Get Balance', value: 'getBalance', action: 'Get sUSDS balance' },
					{ name: 'Deposit', value: 'deposit', action: 'Deposit to sUSDS' },
					{ name: 'Withdraw', value: 'withdraw', action: 'Withdraw from sUSDS' },
					{ name: 'Get Exchange Rate', value: 'getExchangeRate', action: 'Get sUSDS exchange rate' },
					{ name: 'Get APY', value: 'getApy', action: 'Get sUSDS APY' },
				],
				default: 'getBalance',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['skyToken'] } },
				options: [
					{ name: 'Get Balance', value: 'getBalance', action: 'Get SKY balance' },
					{ name: 'Get Total Supply', value: 'getTotalSupply', action: 'Get SKY total supply' },
					{ name: 'Transfer', value: 'transfer', action: 'Transfer SKY' },
					{ name: 'Approve', value: 'approve', action: 'Approve SKY spending' },
				],
				default: 'getBalance',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['dai'] } },
				options: [
					{ name: 'Get Balance', value: 'getBalance', action: 'Get DAI balance' },
					{ name: 'Get Savings Rate', value: 'getSavingsRate', action: 'Get DAI savings rate' },
				],
				default: 'getBalance',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['vault'] } },
				options: [
					{ name: 'Get Vault', value: 'get', action: 'Get vault details' },
					{ name: 'Get Vaults by Owner', value: 'getByOwner', action: 'Get vaults by owner' },
					{ name: 'Get Health', value: 'getHealth', action: 'Get vault health' },
					{ name: 'Get Max Borrowable', value: 'getMaxBorrowable', action: 'Get max borrowable' },
				],
				default: 'get',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['collateral'] } },
				options: [
					{ name: 'Get Types', value: 'getTypes', action: 'Get collateral types' },
					{ name: 'Get Info', value: 'getInfo', action: 'Get collateral info' },
					{ name: 'Get Debt Ceiling', value: 'getDebtCeiling', action: 'Get debt ceiling' },
					{ name: 'Get Stability Fee', value: 'getStabilityFee', action: 'Get stability fee' },
					{ name: 'Get Liquidation Ratio', value: 'getLiquidationRatio', action: 'Get liquidation ratio' },
				],
				default: 'getTypes',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['oracle'] } },
				options: [
					{ name: 'Get Spot Price', value: 'getSpotPrice', action: 'Get spot price' },
					{ name: 'Get OSM Price', value: 'getOsmPrice', action: 'Get OSM price' },
					{ name: 'Get OSM Next Price', value: 'getOsmNextPrice', action: 'Get OSM next price' },
				],
				default: 'getSpotPrice',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['savings'] } },
				options: [
					{ name: 'Get Rate', value: 'getRate', action: 'Get savings rate' },
					{ name: 'Get APY', value: 'getApy', action: 'Get savings APY' },
					{ name: 'Get Chi', value: 'getChi', action: 'Get chi' },
				],
				default: 'getRate',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['psm'] } },
				options: [
					{ name: 'Get Info', value: 'getInfo', action: 'Get PSM info' },
					{ name: 'Swap Gem to USDS', value: 'sellGem', action: 'Swap to USDS' },
					{ name: 'Swap USDS to Gem', value: 'buyGem', action: 'Swap from USDS' },
				],
				default: 'getInfo',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['flashMint'] } },
				options: [
					{ name: 'Get Max', value: 'getMax', action: 'Get max flash mint' },
					{ name: 'Get Fee', value: 'getFee', action: 'Get flash mint fee' },
				],
				default: 'getMax',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['governance'] } },
				options: [
					{ name: 'Get Hat', value: 'getHat', action: 'Get governance hat' },
					{ name: 'Get Voting Power', value: 'getVotingPower', action: 'Get voting power' },
					{ name: 'Get Approvals', value: 'getApprovals', action: 'Get approvals' },
					{ name: 'Get Deposits', value: 'getDeposits', action: 'Get deposits' },
				],
				default: 'getHat',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['migration'] } },
				options: [
					{ name: 'Get Migration Rate', value: 'getRate', action: 'Get migration rate' },
					{ name: 'Check Eligibility', value: 'checkEligibility', action: 'Check migration eligibility' },
					{ name: 'Migrate DAI to USDS', value: 'daiToUsds', action: 'Migrate DAI to USDS' },
					{ name: 'Migrate USDS to DAI', value: 'usdsToDai', action: 'Migrate USDS to DAI' },
					{ name: 'Migrate MKR to SKY', value: 'mkrToSky', action: 'Migrate MKR to SKY' },
				],
				default: 'getRate',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['system'] } },
				options: [
					{ name: 'Get Status', value: 'getStatus', action: 'Get system status' },
					{ name: 'Get Total Debt', value: 'getTotalDebt', action: 'Get total debt' },
					{ name: 'Get Debt Ceiling', value: 'getDebtCeiling', action: 'Get debt ceiling' },
				],
				default: 'getStatus',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['analytics'] } },
				options: [
					{ name: 'Get Protocol Stats', value: 'getStats', action: 'Get protocol stats' },
					{ name: 'Get Protocol TVL', value: 'getTvl', action: 'Get protocol TVL' },
				],
				default: 'getStats',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['subgraph'] } },
				options: [
					{ name: 'Query Vaults', value: 'queryVaults', action: 'Query vaults' },
					{ name: 'Query Collaterals', value: 'queryCollaterals', action: 'Query collaterals' },
					{ name: 'Custom Query', value: 'customQuery', action: 'Custom GraphQL query' },
					{ name: 'Get Status', value: 'getStatus', action: 'Get subgraph status' },
				],
				default: 'queryVaults',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['utility'] } },
				options: [
					{ name: 'Convert WAD to Number', value: 'wadToNumber', action: 'Convert WAD to number' },
					{ name: 'Convert RAY to Number', value: 'rayToNumber', action: 'Convert RAY to number' },
					{ name: 'Calculate Collateral Ratio', value: 'calcCollateralRatio', action: 'Calculate collateral ratio' },
					{ name: 'Calculate Liquidation Price', value: 'calcLiquidationPrice', action: 'Calculate liquidation price' },
					{ name: 'Get Contract Addresses', value: 'getContracts', action: 'Get contract addresses' },
					{ name: 'Estimate Gas', value: 'estimateGas', action: 'Estimate gas' },
				],
				default: 'wadToNumber',
			},

			// ===================== Parameters =====================
			{ displayName: 'Address', name: 'address', type: 'string', default: '', placeholder: '0x...', displayOptions: { show: { resource: ['usds', 'susds', 'skyToken', 'dai', 'governance', 'migration'], operation: ['getBalance', 'getAllowance', 'getVotingPower', 'getDeposits', 'checkEligibility'] } } },
			{ displayName: 'Vault ID', name: 'vaultId', type: 'number', default: 0, displayOptions: { show: { resource: ['vault'], operation: ['get', 'getHealth', 'getMaxBorrowable'] } } },
			{ displayName: 'Owner Address', name: 'ownerAddress', type: 'string', default: '', placeholder: '0x...', displayOptions: { show: { resource: ['vault'], operation: ['getByOwner'] } } },
			{ displayName: 'Collateral Type', name: 'ilk', type: 'options', options: [ { name: 'ETH-A', value: 'ETH-A' }, { name: 'ETH-B', value: 'ETH-B' }, { name: 'ETH-C', value: 'ETH-C' }, { name: 'WBTC-A', value: 'WBTC-A' }, { name: 'WSTETH-A', value: 'WSTETH-A' } ], default: 'ETH-A', displayOptions: { show: { resource: ['collateral', 'oracle'], operation: ['getInfo', 'getDebtCeiling', 'getStabilityFee', 'getLiquidationRatio', 'getSpotPrice', 'getOsmPrice', 'getOsmNextPrice'] } } },
			{ displayName: 'Amount', name: 'amount', type: 'string', default: '0', displayOptions: { show: { resource: ['usds', 'susds', 'skyToken', 'psm', 'migration'], operation: ['transfer', 'approve', 'deposit', 'withdraw', 'sellGem', 'buyGem', 'daiToUsds', 'usdsToDai', 'mkrToSky'] } } },
			{ displayName: 'Recipient', name: 'recipient', type: 'string', default: '', placeholder: '0x...', displayOptions: { show: { resource: ['usds', 'susds', 'skyToken'], operation: ['transfer'] } } },
			{ displayName: 'Spender', name: 'spender', type: 'string', default: '', placeholder: '0x...', displayOptions: { show: { resource: ['usds', 'susds', 'skyToken'], operation: ['approve', 'getAllowance'] } } },
			{ displayName: 'Spell Address', name: 'spellAddress', type: 'string', default: '', placeholder: '0x...', displayOptions: { show: { resource: ['governance'], operation: ['getApprovals'] } } },
			{ displayName: 'WAD Value', name: 'wadValue', type: 'string', default: '0', displayOptions: { show: { resource: ['utility'], operation: ['wadToNumber'] } } },
			{ displayName: 'RAY Value', name: 'rayValue', type: 'string', default: '0', displayOptions: { show: { resource: ['utility'], operation: ['rayToNumber'] } } },
			{ displayName: 'Collateral Value', name: 'collateralValue', type: 'string', default: '0', displayOptions: { show: { resource: ['utility'], operation: ['calcCollateralRatio', 'calcLiquidationPrice'] } } },
			{ displayName: 'Debt Value', name: 'debtValue', type: 'string', default: '0', displayOptions: { show: { resource: ['utility'], operation: ['calcCollateralRatio', 'calcLiquidationPrice'] } } },
			{ displayName: 'Collateral Amount', name: 'collateralAmount', type: 'string', default: '0', displayOptions: { show: { resource: ['utility'], operation: ['calcLiquidationPrice'] } } },
			{ displayName: 'Liquidation Ratio', name: 'liquidationRatio', type: 'number', default: 150, displayOptions: { show: { resource: ['utility'], operation: ['calcLiquidationPrice'] } } },
			{ displayName: 'GraphQL Query', name: 'graphqlQuery', type: 'string', typeOptions: { rows: 5 }, default: '', displayOptions: { show: { resource: ['subgraph'], operation: ['customQuery'] } } },
			{ displayName: 'Query Variables', name: 'queryVariables', type: 'json', default: '{}', displayOptions: { show: { resource: ['subgraph'], operation: ['customQuery'] } } },
			{ displayName: 'First', name: 'first', type: 'number', default: 100, displayOptions: { show: { resource: ['subgraph'], operation: ['queryVaults', 'queryCollaterals'] } } },
			{ displayName: 'Skip', name: 'skip', type: 'number', default: 0, displayOptions: { show: { resource: ['subgraph'], operation: ['queryVaults', 'queryCollaterals'] } } },
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		emitLicensingNotice();

		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('skyNetwork');
		const apiCredentials = await this.getCredentials('skyApi').catch(() => null);

		const network = credentials.network as string;
		const rpcUrl = network === 'custom' ? (credentials.rpcUrl as string) : undefined;
		const chainId = (credentials.chainId as number) || 1;
		const privateKey = credentials.privateKey as string | undefined;

		const skyClient = new SkyClient({ network, rpcUrl, chainId, privateKey, subgraphUrl: apiCredentials?.subgraphUrl as string });
		const vaultClient = new VaultClient(skyClient);
		const governanceClient = new GovernanceClient(skyClient.getProvider(), privateKey ? skyClient.getSigner() : undefined, chainId);
		const subgraphClient = new SubgraphClient(apiCredentials?.subgraphUrl as string, chainId);

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let result: IDataObject = {};

				if (resource === 'usds') {
					if (operation === 'getBalance') {
						const address = this.getNodeParameter('address', i) as string;
						const balance = await skyClient.getUsdsBalance(address);
						result = { address, balance: balance.toString(), formatted: ethers.formatUnits(balance, 18) };
					} else if (operation === 'getTotalSupply') {
						const supply = await skyClient.getUsdsTotalSupply();
						result = { totalSupply: supply.toString(), formatted: ethers.formatUnits(supply, 18) };
					} else if (operation === 'transfer') {
						const recipient = this.getNodeParameter('recipient', i) as string;
						const amount = this.getNodeParameter('amount', i) as string;
						const usdsAddress = getContractAddress('USDS', chainId);
						const txHash = await skyClient.transferToken(usdsAddress, recipient, ethers.parseUnits(amount, 18));
						result = { transactionHash: txHash, recipient, amount };
					} else if (operation === 'approve') {
						const spender = this.getNodeParameter('spender', i) as string;
						const amount = this.getNodeParameter('amount', i) as string;
						const usdsAddress = getContractAddress('USDS', chainId);
						const txHash = await skyClient.approveToken(usdsAddress, spender, ethers.parseUnits(amount, 18));
						result = { transactionHash: txHash, spender, amount };
					} else if (operation === 'getAllowance') {
						const address = this.getNodeParameter('address', i) as string;
						const spender = this.getNodeParameter('spender', i) as string;
						const usdsAddress = getContractAddress('USDS', chainId);
						const allowance = await skyClient.getAllowance(usdsAddress, address, spender);
						result = { owner: address, spender, allowance: allowance.toString(), formatted: ethers.formatUnits(allowance, 18) };
					}
				} else if (resource === 'susds') {
					if (operation === 'getBalance') {
						const address = this.getNodeParameter('address', i) as string;
						const balance = await skyClient.getSusdsBalance(address);
						result = { address, balance: balance.toString(), formatted: ethers.formatUnits(balance, 18) };
					} else if (operation === 'deposit') {
						const amount = this.getNodeParameter('amount', i) as string;
						const txHash = await skyClient.depositToSusds(ethers.parseUnits(amount, 18));
						result = { transactionHash: txHash, amount };
					} else if (operation === 'withdraw') {
						const amount = this.getNodeParameter('amount', i) as string;
						const txHash = await skyClient.withdrawFromSusds(ethers.parseUnits(amount, 18));
						result = { transactionHash: txHash, amount };
					} else if (operation === 'getExchangeRate') {
						const rate = await skyClient.getSusdsExchangeRate();
						result = { exchangeRate: rate.toString(), formatted: ethers.formatUnits(rate, 18) };
					} else if (operation === 'getApy') {
						const rate = await skyClient.getSusdsExchangeRate();
						const apy = mathUtils.rateToApy(rate);
						result = { apy: apy.toString(), apyPercent: `${(Number(apy) * 100).toFixed(2)}%` };
					}
				} else if (resource === 'skyToken') {
					if (operation === 'getBalance') {
						const address = this.getNodeParameter('address', i) as string;
						const balance = await skyClient.getSkyBalance(address);
						result = { address, balance: balance.toString(), formatted: ethers.formatUnits(balance, 18) };
					} else if (operation === 'getTotalSupply') {
						const supply = await skyClient.getSkyTotalSupply();
						result = { totalSupply: supply.toString(), formatted: ethers.formatUnits(supply, 18) };
					} else if (operation === 'transfer') {
						const recipient = this.getNodeParameter('recipient', i) as string;
						const amount = this.getNodeParameter('amount', i) as string;
						const skyAddress = getContractAddress('SKY', chainId);
						const txHash = await skyClient.transferToken(skyAddress, recipient, ethers.parseUnits(amount, 18));
						result = { transactionHash: txHash, recipient, amount };
					} else if (operation === 'approve') {
						const spender = this.getNodeParameter('spender', i) as string;
						const amount = this.getNodeParameter('amount', i) as string;
						const skyAddress = getContractAddress('SKY', chainId);
						const txHash = await skyClient.approveToken(skyAddress, spender, ethers.parseUnits(amount, 18));
						result = { transactionHash: txHash, spender, amount };
					}
				} else if (resource === 'dai') {
					if (operation === 'getBalance') {
						const address = this.getNodeParameter('address', i) as string;
						const balance = await skyClient.getDaiBalance(address);
						result = { address, balance: balance.toString(), formatted: ethers.formatUnits(balance, 18) };
					} else if (operation === 'getSavingsRate') {
						const dsr = await skyClient.getDsr();
						const chi = await skyClient.getDsrChi();
						result = { dsr: dsr.toString(), chi: chi.toString(), apyPercent: `${(Number(mathUtils.rateToApy(dsr)) * 100).toFixed(2)}%` };
					}
				} else if (resource === 'vault') {
					if (operation === 'get') {
						const vaultId = this.getNodeParameter('vaultId', i) as number;
						const vault = await vaultClient.getVault(vaultId);
						result = vault as unknown as IDataObject;
					} else if (operation === 'getByOwner') {
						const ownerAddress = this.getNodeParameter('ownerAddress', i) as string;
						const vaults = await vaultClient.getVaultsByOwner(ownerAddress);
						result = { vaults };
					} else if (operation === 'getHealth') {
						const vaultId = this.getNodeParameter('vaultId', i) as number;
						const health = await vaultClient.getVaultHealthSummary(vaultId);
						result = health as unknown as IDataObject;
					} else if (operation === 'getMaxBorrowable') {
						const vaultId = this.getNodeParameter('vaultId', i) as number;
						const maxBorrowableResult = await vaultClient.getMaxBorrowable(vaultId);
						result = { vaultId, maxBorrowable: maxBorrowableResult.maxDebt.toString(), formatted: maxBorrowableResult.formatted };
					}
				} else if (resource === 'collateral') {
					if (operation === 'getTypes') {
						result = { types: Object.keys(ILKS).map(ilkName => getIlkInfo(ilkName)) };
					} else if (operation === 'getInfo') {
						const ilk = this.getNodeParameter('ilk', i) as string;
						const ilkBytes = ilkToBytes32(ilk);
						const vatIlk = await skyClient.getVatIlk(ilkBytes);
						const jugIlk = await skyClient.getJugIlk(ilkBytes);
						const spotIlk = await skyClient.getSpotIlk(ilkBytes);
						const ilkInfo = getIlkInfo(ilk);
						result = { ...ilkInfo, Art: vatIlk.Art.toString(), rate: vatIlk.rate.toString(), spot: vatIlk.spot.toString(), line: vatIlk.line.toString(), dust: vatIlk.dust.toString(), duty: jugIlk.duty.toString(), mat: spotIlk.mat.toString() };
					} else if (operation === 'getDebtCeiling') {
						const ilk = this.getNodeParameter('ilk', i) as string;
						const ilkBytes = ilkToBytes32(ilk);
						const vatIlk = await skyClient.getVatIlk(ilkBytes);
						result = { ilk, debtCeiling: vatIlk.line.toString(), formatted: ethers.formatUnits(vatIlk.line, 45) };
					} else if (operation === 'getStabilityFee') {
						const ilk = this.getNodeParameter('ilk', i) as string;
						const ilkBytes = ilkToBytes32(ilk);
						const jugIlk = await skyClient.getJugIlk(ilkBytes);
						const base = await skyClient.getBaseRate();
						const totalRate = jugIlk.duty + base;
						result = { ilk, duty: jugIlk.duty.toString(), base: base.toString(), totalRate: totalRate.toString(), apyPercent: `${(Number(mathUtils.rateToApy(totalRate)) * 100).toFixed(2)}%` };
					} else if (operation === 'getLiquidationRatio') {
						const ilk = this.getNodeParameter('ilk', i) as string;
						const ilkBytes = ilkToBytes32(ilk);
						const spotIlk = await skyClient.getSpotIlk(ilkBytes);
						result = { ilk, mat: spotIlk.mat.toString(), percentage: `${(Number(mathUtils.fromRay(spotIlk.mat)) * 100).toFixed(0)}%` };
					}
				} else if (resource === 'oracle') {
					const ilk = this.getNodeParameter('ilk', i) as string;
					const ilkBytes = ilkToBytes32(ilk);
					if (operation === 'getSpotPrice') {
						const vatIlk = await skyClient.getVatIlk(ilkBytes);
						result = { ilk, spotPrice: vatIlk.spot.toString(), formatted: ethers.formatUnits(vatIlk.spot, 27) };
					} else if (operation === 'getOsmPrice') {
						const osmAddress = ORACLES[ilk]?.osm || ORACLES['ETH-A']?.osm;
						if (osmAddress) {
							const priceData = await skyClient.getOsmPrice(osmAddress);
							result = { ilk, osmPrice: priceData.price.toString(), valid: priceData.valid, formatted: ethers.formatUnits(priceData.price, 18) };
						} else {
							result = { ilk, error: 'No OSM oracle found for this ilk' };
						}
					} else if (operation === 'getOsmNextPrice') {
						const osmAddress = ORACLES[ilk]?.osm || ORACLES['ETH-A']?.osm;
						if (osmAddress) {
							const priceData = await skyClient.getOsmNextPrice(osmAddress);
							result = { ilk, nextPrice: priceData.price.toString(), valid: priceData.valid, formatted: ethers.formatUnits(priceData.price, 18) };
						} else {
							result = { ilk, error: 'No OSM oracle found for this ilk' };
						}
					}
				} else if (resource === 'savings') {
					if (operation === 'getRate') {
						const dsr = await skyClient.getDsr();
						result = { dsr: dsr.toString(), apyPercent: `${(Number(mathUtils.rateToApy(dsr)) * 100).toFixed(2)}%` };
					} else if (operation === 'getApy') {
						const dsr = await skyClient.getDsr();
						const apy = mathUtils.rateToApy(dsr);
						result = { apy: (Number(apy) * 100).toFixed(4), apyPercent: `${(Number(apy) * 100).toFixed(2)}%` };
					} else if (operation === 'getChi') {
						const chi = await skyClient.getDsrChi();
						result = { chi: chi.toString(), formatted: ethers.formatUnits(chi, 27) };
					}
				} else if (resource === 'psm') {
					if (operation === 'getInfo') {
						const info = await skyClient.getPsmInfo('USDC');
						result = info as unknown as IDataObject;
					} else if (operation === 'sellGem') {
						const amount = this.getNodeParameter('amount', i) as string;
						const txHash = await skyClient.psmSellGem('USDC', ethers.parseUnits(amount, 6));
						result = { transactionHash: txHash, amount };
					} else if (operation === 'buyGem') {
						const amount = this.getNodeParameter('amount', i) as string;
						const txHash = await skyClient.psmBuyGem('USDC', ethers.parseUnits(amount, 18));
						result = { transactionHash: txHash, amount };
					}
				} else if (resource === 'flashMint') {
					if (operation === 'getMax') {
						const max = await skyClient.getFlashMintMax();
						result = { maxFlashMint: max.toString(), formatted: ethers.formatUnits(max, 18) };
					} else if (operation === 'getFee') {
						const fee = await skyClient.getFlashMintFee();
						result = { fee: fee.toString(), percentage: `${(Number(fee) / 10000).toFixed(2)}%` };
					}
				} else if (resource === 'governance') {
					if (operation === 'getHat') {
						const hat = await governanceClient.getHat();
						result = { hat };
					} else if (operation === 'getVotingPower') {
						const address = this.getNodeParameter('address', i) as string;
						const power = await governanceClient.getVotingPower(address);
						result = { address, votingPower: power.toString(), formatted: ethers.formatUnits(power, 18) };
					} else if (operation === 'getApprovals') {
						const spellAddress = this.getNodeParameter('spellAddress', i) as string;
						const approvals = await governanceClient.getApprovals(spellAddress);
						result = { spell: spellAddress, approvals: approvals.toString(), formatted: ethers.formatUnits(approvals, 18) };
					} else if (operation === 'getDeposits') {
						const address = this.getNodeParameter('address', i) as string;
						const deposits = await governanceClient.getDeposits(address);
						result = { address, deposits: deposits.toString(), formatted: ethers.formatUnits(deposits, 18) };
					}
				} else if (resource === 'migration') {
					if (operation === 'getRate') {
						const mkrToSkyRate = await skyClient.getMkrToSkyRate();
						result = { daiToUsds: '1:1', mkrToSky: `1:${mkrToSkyRate.toString()}` };
					} else if (operation === 'checkEligibility') {
						const address = this.getNodeParameter('address', i) as string;
						const daiBalance = await skyClient.getDaiBalance(address);
						result = { address, daiBalance: ethers.formatUnits(daiBalance, 18), canMigrate: daiBalance > BigInt(0) };
					} else if (operation === 'daiToUsds') {
						const amount = this.getNodeParameter('amount', i) as string;
						const txHash = await skyClient.migrateDaiToUsds(ethers.parseUnits(amount, 18));
						result = { transactionHash: txHash, daiAmount: amount, usdsAmount: amount };
					} else if (operation === 'usdsToDai') {
						const amount = this.getNodeParameter('amount', i) as string;
						const txHash = await skyClient.migrateUsdsToDai(ethers.parseUnits(amount, 18));
						result = { transactionHash: txHash, usdsAmount: amount, daiAmount: amount };
					} else if (operation === 'mkrToSky') {
						const amount = this.getNodeParameter('amount', i) as string;
						const txHash = await skyClient.migrateMkrToSky(ethers.parseUnits(amount, 18));
						const skyAmount = migrationUtils.calculateMkrToSky(ethers.parseUnits(amount, 18));
						result = { transactionHash: txHash, mkrAmount: amount, skyAmount: ethers.formatUnits(skyAmount, 18) };
					}
				} else if (resource === 'system') {
					if (operation === 'getTotalDebt') {
						const debt = await skyClient.getTotalDebt();
						result = { totalDebt: debt.toString(), formatted: ethers.formatUnits(debt, 45) };
					} else if (operation === 'getDebtCeiling') {
						const ceiling = await skyClient.getGlobalDebtCeiling();
						result = { debtCeiling: ceiling.toString(), formatted: ethers.formatUnits(ceiling, 45) };
					} else if (operation === 'getStatus') {
						const [totalDebt, debtCeiling, blockNumber] = await Promise.all([skyClient.getTotalDebt(), skyClient.getGlobalDebtCeiling(), skyClient.getBlockNumber()]);
						result = { totalDebt: ethers.formatUnits(totalDebt, 45), debtCeiling: ethers.formatUnits(debtCeiling, 45), utilization: `${((Number(totalDebt) / Number(debtCeiling)) * 100).toFixed(2)}%`, blockNumber: blockNumber.toString(), chainId };
					}
				} else if (resource === 'analytics') {
					if (operation === 'getStats') {
						const stats = await subgraphClient.getProtocolStats();
						result = stats as unknown as IDataObject;
					} else if (operation === 'getTvl') {
						const stats = await subgraphClient.getProtocolStats();
						result = { tvl: stats.totalCollateral, totalDebt: stats.totalDebt, vaultCount: stats.totalVaults };
					}
				} else if (resource === 'subgraph') {
					const first = this.getNodeParameter('first', i, 100) as number;
					const skip = this.getNodeParameter('skip', i, 0) as number;
					if (operation === 'queryVaults') {
						const vaults = await subgraphClient.queryVaults({ first, skip });
						result = { vaults };
					} else if (operation === 'queryCollaterals') {
						const collaterals = await subgraphClient.queryCollaterals({ first, skip });
						result = { collaterals };
					} else if (operation === 'customQuery') {
						const query = this.getNodeParameter('graphqlQuery', i) as string;
						const variables = JSON.parse(this.getNodeParameter('queryVariables', i, '{}') as string);
						const data = await subgraphClient.customQuery(query, variables);
						result = data as IDataObject;
					} else if (operation === 'getStatus') {
						const status = await subgraphClient.getStatus();
						result = status as unknown as IDataObject;
					}
				} else if (resource === 'utility') {
					if (operation === 'wadToNumber') {
						const wadValue = this.getNodeParameter('wadValue', i) as string;
						const number = mathUtils.fromWad(BigInt(wadValue));
						result = { wadValue, number: number.toString() };
					} else if (operation === 'rayToNumber') {
						const rayValue = this.getNodeParameter('rayValue', i) as string;
						const number = mathUtils.fromRay(BigInt(rayValue));
						result = { rayValue, number: number.toString() };
					} else if (operation === 'calcCollateralRatio') {
						const collateralValue = this.getNodeParameter('collateralValue', i) as string;
						const debtValue = this.getNodeParameter('debtValue', i) as string;
						const ratio = mathUtils.calculateCollateralRatio(BigInt(Math.floor(Number(collateralValue) * 1e18)), BigInt(Math.floor(Number(debtValue) * 1e18)));
						result = { collateralValue, debtValue, ratio: Number(ratio) / 100, percentage: `${Number(ratio)}%` };
					} else if (operation === 'calcLiquidationPrice') {
						const debtValue = this.getNodeParameter('debtValue', i) as string;
						const collateralAmount = this.getNodeParameter('collateralAmount', i) as string;
						const liquidationRatio = this.getNodeParameter('liquidationRatio', i) as number;
						const liqPrice = mathUtils.calculateLiquidationPrice(BigInt(Math.floor(Number(debtValue) * 1e18)), BigInt(Math.floor(Number(collateralAmount) * 1e18)), BigInt(liquidationRatio));
						result = { debtValue, collateralAmount, liquidationRatio: `${liquidationRatio}%`, liquidationPrice: ethers.formatUnits(liqPrice, 18) };
					} else if (operation === 'getContracts') {
						result = { chainId, contracts: { USDS: getContractAddress('USDS', chainId), sUSDS: getContractAddress('sUSDS', chainId), SKY: getContractAddress('SKY', chainId), DAI: getContractAddress('DAI', chainId), MKR: getContractAddress('MKR', chainId), VAT: getContractAddress('VAT', chainId) } };
					} else if (operation === 'estimateGas') {
						const gasPrice = await skyClient.getGasPrice();
						result = { gasPrice: gasPrice.toString(), gasPriceGwei: ethers.formatUnits(gasPrice, 'gwei') };
					}
				}

				returnData.push({ json: result });
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error instanceof Error ? error.message : 'Unknown error' } });
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
