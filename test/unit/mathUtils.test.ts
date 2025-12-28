/**
 * @license
 * Business Source License 1.1
 * Copyright (c) 2024 Velocity BPA
 * Licensed under the BSL 1.1 - Commercial use requires a license from Velocity BPA.
 * See LICENSE file for details.
 */

import {
	WAD,
	RAY,
	RAD,
	toWad,
	fromWad,
	toRay,
	fromRay,
	toRad,
	fromRad,
	wmul,
	wdiv,
	rmul,
	rdiv,
	wadToRay,
	rayToWad,
	calculateCollateralRatio,
	calculateLiquidationPrice,
	rateToApy,
} from '../../nodes/Sky/utils/mathUtils';

describe('Math Utilities', () => {
	describe('WAD conversions', () => {
		it('should convert number to WAD', () => {
			expect(toWad(1)).toBe(WAD);
			expect(toWad(100)).toBe(WAD * BigInt(100));
			expect(toWad(0.5)).toBe(WAD / BigInt(2));
		});

		it('should convert WAD to number', () => {
			expect(fromWad(WAD)).toBe(1);
			expect(fromWad(WAD * BigInt(100))).toBe(100);
			expect(fromWad(WAD / BigInt(2))).toBe(0.5);
		});
	});

	describe('RAY conversions', () => {
		it('should convert number to RAY', () => {
			expect(toRay(1)).toBe(RAY);
			expect(toRay(100)).toBe(RAY * BigInt(100));
		});

		it('should convert RAY to number', () => {
			expect(fromRay(RAY)).toBe(1);
			expect(fromRay(RAY * BigInt(100))).toBe(100);
		});
	});

	describe('RAD conversions', () => {
		it('should convert number to RAD', () => {
			expect(toRad(1)).toBe(RAD);
		});

		it('should convert RAD to number', () => {
			expect(fromRad(RAD)).toBe(1);
		});
	});

	describe('WAD arithmetic', () => {
		it('should multiply WAD values', () => {
			const a = toWad(2);
			const b = toWad(3);
			expect(wmul(a, b)).toBe(toWad(6));
		});

		it('should divide WAD values', () => {
			const a = toWad(6);
			const b = toWad(2);
			expect(wdiv(a, b)).toBe(toWad(3));
		});
	});

	describe('RAY arithmetic', () => {
		it('should multiply RAY values', () => {
			const a = toRay(2);
			const b = toRay(3);
			expect(rmul(a, b)).toBe(toRay(6));
		});

		it('should divide RAY values', () => {
			const a = toRay(6);
			const b = toRay(2);
			expect(rdiv(a, b)).toBe(toRay(3));
		});
	});

	describe('Cross-precision conversions', () => {
		it('should convert WAD to RAY', () => {
			expect(wadToRay(WAD)).toBe(RAY);
		});

		it('should convert RAY to WAD', () => {
			expect(rayToWad(RAY)).toBe(WAD);
		});
	});

	describe('DeFi calculations', () => {
		it('should calculate collateral ratio', () => {
			const collateral = toWad(200); // $200 collateral
			const debt = toWad(100); // $100 debt
			const ratio = calculateCollateralRatio(collateral, debt);
			expect(ratio).toBe(BigInt(200)); // 200%
		});

		it('should return max ratio for zero debt', () => {
			const collateral = toWad(200);
			const debt = BigInt(0);
			const ratio = calculateCollateralRatio(collateral, debt);
			expect(ratio).toBe(BigInt(999999)); // Max ratio
		});

		it('should calculate liquidation price', () => {
			const debt = toWad(1000); // $1000 debt
			const collateral = toWad(10); // 10 ETH
			const liquidationRatio = BigInt(150); // 150%
			const liqPrice = calculateLiquidationPrice(debt, collateral, liquidationRatio);
			// Liq price = (debt * ratio) / collateral = (1000 * 1.5) / 10 = $150
			expect(fromWad(liqPrice)).toBe(150);
		});

		it('should convert rate to APY', () => {
			// Test with a typical DSR rate (approximately 1% APY)
			const rate = RAY + RAY / BigInt(100); // 1.01 in RAY
			const apy = rateToApy(rate);
			expect(apy).toBeGreaterThan(0);
			expect(apy).toBeLessThan(1);
		});
	});
});
