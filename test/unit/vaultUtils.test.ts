/**
 * @license
 * Business Source License 1.1
 * Copyright (c) 2024 Velocity BPA
 * Licensed under the BSL 1.1 - Commercial use requires a license from Velocity BPA.
 * See LICENSE file for details.
 */

import { VaultStatus, isValidAddress, parseVaultId } from '../../nodes/Sky/utils/vaultUtils';

describe('Vault Utilities', () => {
	describe('VaultStatus', () => {
		it('should have correct status values', () => {
			expect(VaultStatus.SAFE).toBe('SAFE');
			expect(VaultStatus.WARNING).toBe('WARNING');
			expect(VaultStatus.DANGER).toBe('DANGER');
			expect(VaultStatus.LIQUIDATABLE).toBe('LIQUIDATABLE');
		});
	});

	describe('parseVaultId', () => {
		it('should parse valid vault ID string', () => {
			expect(parseVaultId('12345')).toBe(12345);
		});

		it('should parse vault ID number', () => {
			expect(parseVaultId(12345)).toBe(12345);
		});

		it('should return null for invalid input', () => {
			expect(parseVaultId('invalid')).toBeNull();
			expect(parseVaultId('')).toBeNull();
		});
	});

	describe('isValidAddress', () => {
		it('should validate correct Ethereum addresses', () => {
			expect(isValidAddress('0x1234567890123456789012345678901234567890')).toBe(true);
			expect(isValidAddress('0xABCDEF1234567890ABCDEF1234567890ABCDEF12')).toBe(true);
		});

		it('should reject invalid addresses', () => {
			expect(isValidAddress('0x123')).toBe(false);
			expect(isValidAddress('not-an-address')).toBe(false);
			expect(isValidAddress('')).toBe(false);
		});
	});
});
