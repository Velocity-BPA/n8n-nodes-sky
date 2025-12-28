/**
 * @license
 * Business Source License 1.1
 * Copyright (c) 2024 Velocity BPA
 * Licensed under the BSL 1.1 - Commercial use requires a license from Velocity BPA.
 * See LICENSE file for details.
 */

import { ethers, Contract, Provider, Signer } from 'ethers';
import { getContractAddress } from '../constants/contracts';

// MKR/SKY Chief ABI (governance)
const CHIEF_ABI = [
	'function GOV() view returns (address)',
	'function IOU() view returns (address)',
	'function hat() view returns (address)',
	'function approvals(address) view returns (uint256)',
	'function deposits(address) view returns (uint256)',
	'function lock(uint256 wad)',
	'function free(uint256 wad)',
	'function vote(address[] calldata slate) returns (bytes32)',
	'function vote(bytes32 slate)',
	'function etch(address[] calldata yays) returns (bytes32)',
	'function lift(address whom)',
	'function slates(bytes32) view returns (address[])',
	'function votes(address) view returns (bytes32)',
	'function last(address) view returns (uint256)',
	'function MAX_YAYS() view returns (uint256)',
	'event LogNote(bytes4 indexed sig, address indexed guy, bytes32 indexed foo, bytes32 indexed bar, uint256 wad, bytes fax)',
	'event Etch(bytes32 indexed slate)',
];

// Spell interface
const SPELL_ABI = [
	'function done() view returns (bool)',
	'function eta() view returns (uint256)',
	'function action() view returns (address)',
	'function description() view returns (string)',
	'function schedule()',
	'function cast()',
];

// Polling contract ABI
const POLLING_ABI = [
	'function npoll() view returns (uint256)',
	'function vote(uint256 pollId, uint256 optionId)',
	'function withdraw(uint256 pollId)',
	'function getOptionVotingFor(address voter, uint256 pollId) view returns (uint256)',
	'function polls(uint256) view returns (address, uint48, uint48)',
	'event Voted(address indexed voter, uint256 indexed pollId, uint256 indexed optionId)',
];

export interface SpellInfo {
	address: string;
	done: boolean;
	eta: bigint;
	description: string;
	actionAddress: string;
}

export interface VotingStats {
	totalMkrLocked: bigint;
	currentHat: string;
	hatApprovals: bigint;
}

export interface DelegateInfo {
	address: string;
	votingPower: bigint;
	delegators: string[];
}

export class GovernanceClient {
	private provider: Provider;
	private signer?: Signer;
	private chainId: number;
	private chiefContract: Contract;

	constructor(provider: Provider, signer?: Signer, chainId: number = 1) {
		this.provider = provider;
		this.signer = signer;
		this.chainId = chainId;

		const chiefAddress = getContractAddress('CHIEF', chainId);
		this.chiefContract = new Contract(
			chiefAddress,
			CHIEF_ABI,
			signer || provider
		);
	}

	/**
	 * Get the current hat (active spell)
	 */
	async getHat(): Promise<string> {
		return await this.chiefContract.hat();
	}

	/**
	 * Get governance token address (MKR/SKY)
	 */
	async getGovernanceToken(): Promise<string> {
		return await this.chiefContract.GOV();
	}

	/**
	 * Get IOU token address
	 */
	async getIouToken(): Promise<string> {
		return await this.chiefContract.IOU();
	}

	/**
	 * Get approvals for an address (spell or candidate)
	 */
	async getApprovals(address: string): Promise<bigint> {
		return await this.chiefContract.approvals(address);
	}

	/**
	 * Get deposits for an address
	 */
	async getDeposits(address: string): Promise<bigint> {
		return await this.chiefContract.deposits(address);
	}

	/**
	 * Get the current slate (voted addresses) for a voter
	 */
	async getVotedSlate(voter: string): Promise<string> {
		return await this.chiefContract.votes(voter);
	}

	/**
	 * Get addresses in a slate
	 */
	async getSlateAddresses(slateHash: string): Promise<string[]> {
		return await this.chiefContract.slates(slateHash);
	}

	/**
	 * Get spell information
	 */
	async getSpellInfo(spellAddress: string): Promise<SpellInfo> {
		const spell = new Contract(spellAddress, SPELL_ABI, this.provider);

		try {
			const [done, eta, action, description] = await Promise.all([
				spell.done().catch(() => false),
				spell.eta().catch(() => BigInt(0)),
				spell.action().catch(() => ethers.ZeroAddress),
				spell.description().catch(() => ''),
			]);

			return {
				address: spellAddress,
				done,
				eta,
				description,
				actionAddress: action,
			};
		} catch {
			return {
				address: spellAddress,
				done: false,
				eta: BigInt(0),
				description: '',
				actionAddress: ethers.ZeroAddress,
			};
		}
	}

	/**
	 * Lock MKR/SKY tokens in the Chief contract
	 */
	async lock(amount: bigint): Promise<ethers.ContractTransactionResponse> {
		if (!this.signer) throw new Error('Signer required for lock');
		return await this.chiefContract.lock(amount);
	}

	/**
	 * Free MKR/SKY tokens from the Chief contract
	 */
	async free(amount: bigint): Promise<ethers.ContractTransactionResponse> {
		if (!this.signer) throw new Error('Signer required for free');
		return await this.chiefContract.free(amount);
	}

	/**
	 * Vote for a list of addresses (spells)
	 */
	async vote(addresses: string[]): Promise<ethers.ContractTransactionResponse> {
		if (!this.signer) throw new Error('Signer required for vote');
		return await this.chiefContract['vote(address[])'](addresses);
	}

	/**
	 * Vote using a pre-computed slate hash
	 */
	async voteSlate(slateHash: string): Promise<ethers.ContractTransactionResponse> {
		if (!this.signer) throw new Error('Signer required for vote');
		return await this.chiefContract['vote(bytes32)'](slateHash);
	}

	/**
	 * Create a new slate from a list of addresses
	 */
	async etch(addresses: string[]): Promise<ethers.ContractTransactionResponse> {
		if (!this.signer) throw new Error('Signer required for etch');
		return await this.chiefContract.etch(addresses);
	}

	/**
	 * Lift an address to become the hat if it has the most approvals
	 */
	async lift(address: string): Promise<ethers.ContractTransactionResponse> {
		if (!this.signer) throw new Error('Signer required for lift');
		return await this.chiefContract.lift(address);
	}

	/**
	 * Get voting stats
	 */
	async getVotingStats(): Promise<VotingStats> {
		const hat = await this.getHat();
		const hatApprovals = await this.getApprovals(hat);

		// Calculate total MKR locked - this requires summing all deposits
		// For simplicity, we'll use the hat approvals as a proxy
		return {
			totalMkrLocked: hatApprovals, // This is approximate
			currentHat: hat,
			hatApprovals,
		};
	}

	/**
	 * Check if an address is the current hat
	 */
	async isHat(address: string): Promise<boolean> {
		const hat = await this.getHat();
		return hat.toLowerCase() === address.toLowerCase();
	}

	/**
	 * Get voting power for an address (their locked tokens)
	 */
	async getVotingPower(address: string): Promise<bigint> {
		return await this.getDeposits(address);
	}

	/**
	 * Schedule a spell for execution
	 */
	async scheduleSpell(spellAddress: string): Promise<ethers.ContractTransactionResponse> {
		if (!this.signer) throw new Error('Signer required for schedule');
		const spell = new Contract(spellAddress, SPELL_ABI, this.signer);
		return await spell.schedule();
	}

	/**
	 * Cast (execute) a spell
	 */
	async castSpell(spellAddress: string): Promise<ethers.ContractTransactionResponse> {
		if (!this.signer) throw new Error('Signer required for cast');
		const spell = new Contract(spellAddress, SPELL_ABI, this.signer);
		return await spell.cast();
	}

	/**
	 * Check if a spell is ready to cast (past its eta)
	 */
	async isSpellReady(spellAddress: string): Promise<boolean> {
		const spellInfo = await this.getSpellInfo(spellAddress);
		if (spellInfo.done) return false;
		if (spellInfo.eta === BigInt(0)) return false;

		const block = await this.provider.getBlock('latest');
		if (!block) return false;

		return BigInt(block.timestamp) >= spellInfo.eta;
	}

	/**
	 * Get maximum number of addresses in a slate
	 */
	async getMaxYays(): Promise<bigint> {
		return await this.chiefContract.MAX_YAYS();
	}

	/**
	 * Get the last block a user voted in
	 */
	async getLastVoteBlock(address: string): Promise<bigint> {
		return await this.chiefContract.last(address);
	}

	/**
	 * Format voting power for display
	 */
	formatVotingPower(amount: bigint, decimals: number = 18): string {
		return ethers.formatUnits(amount, decimals);
	}
}

/**
 * Create a governance client instance
 */
export function createGovernanceClient(
	provider: Provider,
	signer?: Signer,
	chainId: number = 1
): GovernanceClient {
	return new GovernanceClient(provider, signer, chainId);
}
