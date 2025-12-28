/**
 * @license
 * Business Source License 1.1
 * Copyright (c) 2024 Velocity BPA
 * Licensed under the BSL 1.1 - Commercial use requires a license from Velocity BPA.
 * See LICENSE file for details.
 */

import { request, gql, GraphQLClient } from 'graphql-request';
import { NETWORKS } from '../constants/networks';

// Default subgraph endpoints
const SUBGRAPH_ENDPOINTS: Record<number, string> = {
	1: 'https://api.thegraph.com/subgraphs/name/makerdao/maker-protocol',
	8453: 'https://api.thegraph.com/subgraphs/name/sky-ecosystem/sky-base',
	11155111: 'https://api.thegraph.com/subgraphs/name/makerdao/maker-protocol-sepolia',
};

export interface SubgraphVault {
	id: string;
	cdpId: string;
	ilk: string;
	owner: string;
	collateral: string;
	debt: string;
	createdAt: string;
	updatedAt: string;
}

export interface SubgraphIlk {
	id: string;
	name: string;
	rate: string;
	art: string;
	spot: string;
	line: string;
	dust: string;
}

export interface SubgraphLiquidation {
	id: string;
	vault: string;
	ilk: string;
	collateralAmount: string;
	debtAmount: string;
	penalty: string;
	timestamp: string;
	keeper: string;
}

export interface SubgraphPrice {
	id: string;
	ilk: string;
	price: string;
	timestamp: string;
}

export interface SubgraphStatus {
	synced: boolean;
	blockNumber: number;
	chainHeadBlock: number;
	latestBlock: number;
}

export class SubgraphClient {
	private endpoint: string;
	private client: GraphQLClient;

	constructor(endpoint?: string, chainId: number = 1) {
		this.endpoint = endpoint || SUBGRAPH_ENDPOINTS[chainId] || SUBGRAPH_ENDPOINTS[1];
		this.client = new GraphQLClient(this.endpoint);
	}

	/**
	 * Set API key for authenticated requests
	 */
	setApiKey(apiKey: string): void {
		this.client = new GraphQLClient(this.endpoint, {
			headers: {
				'Authorization': `Bearer ${apiKey}`,
			},
		});
	}

	/**
	 * Query vaults with filters
	 */
	async queryVaults(options: {
		owner?: string;
		ilk?: string;
		first?: number;
		skip?: number;
		orderBy?: string;
		orderDirection?: 'asc' | 'desc';
	} = {}): Promise<SubgraphVault[]> {
		const {
			owner,
			ilk,
			first = 100,
			skip = 0,
			orderBy = 'updatedAt',
			orderDirection = 'desc',
		} = options;

		const where: string[] = [];
		if (owner) where.push(`owner: "${owner.toLowerCase()}"`);
		if (ilk) where.push(`ilk: "${ilk}"`);

		const whereClause = where.length > 0 ? `where: { ${where.join(', ')} }` : '';

		const query = gql`
			query GetVaults($first: Int!, $skip: Int!) {
				vaults(
					first: $first
					skip: $skip
					orderBy: ${orderBy}
					orderDirection: ${orderDirection}
					${whereClause}
				) {
					id
					cdpId
					ilk
					owner
					collateral
					debt
					createdAt
					updatedAt
				}
			}
		`;

		const result = await this.client.request<{ vaults: SubgraphVault[] }>(query, { first, skip });
		return result.vaults;
	}

	/**
	 * Query a specific vault by CDP ID
	 */
	async queryVaultById(cdpId: string): Promise<SubgraphVault | null> {
		const query = gql`
			query GetVault($cdpId: String!) {
				vaults(where: { cdpId: $cdpId }) {
					id
					cdpId
					ilk
					owner
					collateral
					debt
					createdAt
					updatedAt
				}
			}
		`;

		const result = await this.client.request<{ vaults: SubgraphVault[] }>(query, { cdpId });
		return result.vaults[0] || null;
	}

	/**
	 * Query collateral types (ilks)
	 */
	async queryCollaterals(options: {
		first?: number;
		skip?: number;
	} = {}): Promise<SubgraphIlk[]> {
		const { first = 100, skip = 0 } = options;

		const query = gql`
			query GetCollaterals($first: Int!, $skip: Int!) {
				ilks(first: $first, skip: $skip, orderBy: name) {
					id
					name
					rate
					art
					spot
					line
					dust
				}
			}
		`;

		const result = await this.client.request<{ ilks: SubgraphIlk[] }>(query, { first, skip });
		return result.ilks;
	}

	/**
	 * Query liquidations
	 */
	async queryLiquidations(options: {
		ilk?: string;
		vault?: string;
		startTime?: number;
		endTime?: number;
		first?: number;
		skip?: number;
	} = {}): Promise<SubgraphLiquidation[]> {
		const {
			ilk,
			vault,
			startTime,
			endTime,
			first = 100,
			skip = 0,
		} = options;

		const where: string[] = [];
		if (ilk) where.push(`ilk: "${ilk}"`);
		if (vault) where.push(`vault: "${vault}"`);
		if (startTime) where.push(`timestamp_gte: ${startTime}`);
		if (endTime) where.push(`timestamp_lte: ${endTime}`);

		const whereClause = where.length > 0 ? `where: { ${where.join(', ')} }` : '';

		const query = gql`
			query GetLiquidations($first: Int!, $skip: Int!) {
				liquidations(
					first: $first
					skip: $skip
					orderBy: timestamp
					orderDirection: desc
					${whereClause}
				) {
					id
					vault
					ilk
					collateralAmount
					debtAmount
					penalty
					timestamp
					keeper
				}
			}
		`;

		const result = await this.client.request<{ liquidations: SubgraphLiquidation[] }>(query, { first, skip });
		return result.liquidations;
	}

	/**
	 * Query price history
	 */
	async queryPrices(options: {
		ilk?: string;
		startTime?: number;
		endTime?: number;
		first?: number;
		skip?: number;
	} = {}): Promise<SubgraphPrice[]> {
		const {
			ilk,
			startTime,
			endTime,
			first = 100,
			skip = 0,
		} = options;

		const where: string[] = [];
		if (ilk) where.push(`ilk: "${ilk}"`);
		if (startTime) where.push(`timestamp_gte: ${startTime}`);
		if (endTime) where.push(`timestamp_lte: ${endTime}`);

		const whereClause = where.length > 0 ? `where: { ${where.join(', ')} }` : '';

		const query = gql`
			query GetPrices($first: Int!, $skip: Int!) {
				prices(
					first: $first
					skip: $skip
					orderBy: timestamp
					orderDirection: desc
					${whereClause}
				) {
					id
					ilk
					price
					timestamp
				}
			}
		`;

		const result = await this.client.request<{ prices: SubgraphPrice[] }>(query, { first, skip });
		return result.prices;
	}

	/**
	 * Query governance data (proposals, votes)
	 */
	async queryGovernance(options: {
		type?: 'proposal' | 'vote' | 'spell';
		status?: string;
		first?: number;
		skip?: number;
	} = {}): Promise<unknown[]> {
		const { type = 'proposal', first = 100, skip = 0, status } = options;

		let query: string;

		switch (type) {
			case 'proposal':
				query = gql`
					query GetProposals($first: Int!, $skip: Int!) {
						proposals(
							first: $first
							skip: $skip
							orderBy: createdAt
							orderDirection: desc
							${status ? `where: { status: "${status}" }` : ''}
						) {
							id
							title
							description
							status
							createdAt
							executedAt
							creator
							yesVotes
							noVotes
						}
					}
				`;
				break;

			case 'spell':
				query = gql`
					query GetSpells($first: Int!, $skip: Int!) {
						spells(
							first: $first
							skip: $skip
							orderBy: timestamp
							orderDirection: desc
						) {
							id
							address
							description
							eta
							done
							cast
							timestamp
						}
					}
				`;
				break;

			case 'vote':
				query = gql`
					query GetVotes($first: Int!, $skip: Int!) {
						votes(
							first: $first
							skip: $skip
							orderBy: timestamp
							orderDirection: desc
						) {
							id
							voter
							proposal
							optionId
							weight
							timestamp
						}
					}
				`;
				break;

			default:
				throw new Error(`Unknown governance type: ${type}`);
		}

		const result = await this.client.request<{ [key: string]: unknown[] }>(query, { first, skip });
		return Object.values(result)[0] || [];
	}

	/**
	 * Execute a custom GraphQL query
	 */
	async customQuery<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
		return await this.client.request<T>(query, variables);
	}

	/**
	 * Get subgraph status
	 */
	async getStatus(): Promise<SubgraphStatus> {
		const query = gql`
			query GetStatus {
				_meta {
					block {
						number
					}
					hasIndexingErrors
				}
			}
		`;

		try {
			const result = await this.client.request<{
				_meta: {
					block: { number: number };
					hasIndexingErrors: boolean;
				};
			}>(query);

			return {
				synced: !result._meta.hasIndexingErrors,
				blockNumber: result._meta.block.number,
				chainHeadBlock: result._meta.block.number,
				latestBlock: result._meta.block.number,
			};
		} catch {
			return {
				synced: false,
				blockNumber: 0,
				chainHeadBlock: 0,
				latestBlock: 0,
			};
		}
	}

	/**
	 * Query liquidatable vaults (low collateral ratio)
	 */
	async queryLiquidatableVaults(options: {
		minCollateralRatio?: number;
		ilk?: string;
		first?: number;
	} = {}): Promise<SubgraphVault[]> {
		const { minCollateralRatio = 150, ilk, first = 100 } = options;

		// Note: This is a simplified query - actual liquidation status
		// requires comparing with oracle prices
		const where: string[] = ['debt_gt: "0"'];
		if (ilk) where.push(`ilk: "${ilk}"`);

		const query = gql`
			query GetLiquidatableVaults($first: Int!) {
				vaults(
					first: $first
					orderBy: debt
					orderDirection: desc
					where: { ${where.join(', ')} }
				) {
					id
					cdpId
					ilk
					owner
					collateral
					debt
					createdAt
					updatedAt
				}
			}
		`;

		const result = await this.client.request<{ vaults: SubgraphVault[] }>(query, { first });
		return result.vaults;
	}

	/**
	 * Get protocol statistics
	 */
	async getProtocolStats(): Promise<{
		totalVaults: number;
		totalDebt: string;
		totalCollateral: string;
		activeIlks: number;
	}> {
		const query = gql`
			query GetProtocolStats {
				systemState(id: "current") {
					totalVaults
					totalDebt
					totalCollateral
				}
				ilks(where: { art_gt: "0" }) {
					id
				}
			}
		`;

		try {
			const result = await this.client.request<{
				systemState: {
					totalVaults: number;
					totalDebt: string;
					totalCollateral: string;
				};
				ilks: { id: string }[];
			}>(query);

			return {
				totalVaults: result.systemState?.totalVaults || 0,
				totalDebt: result.systemState?.totalDebt || '0',
				totalCollateral: result.systemState?.totalCollateral || '0',
				activeIlks: result.ilks?.length || 0,
			};
		} catch {
			return {
				totalVaults: 0,
				totalDebt: '0',
				totalCollateral: '0',
				activeIlks: 0,
			};
		}
	}

	/**
	 * Change subgraph endpoint
	 */
	setEndpoint(endpoint: string): void {
		this.endpoint = endpoint;
		this.client = new GraphQLClient(this.endpoint);
	}

	/**
	 * Get current endpoint
	 */
	getEndpoint(): string {
		return this.endpoint;
	}
}

/**
 * Create a subgraph client instance
 */
export function createSubgraphClient(
	endpoint?: string,
	chainId: number = 1
): SubgraphClient {
	return new SubgraphClient(endpoint, chainId);
}
