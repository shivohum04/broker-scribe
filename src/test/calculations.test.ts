import { describe, it, expect } from 'vitest';
import { convertToUnit, calculateTotal, calculateRatePerUnit } from '@/lib/calculations';

describe('Property Calculations', () => {
  describe('convertToUnit', () => {
    it('returns the same value when converting to the same unit', () => {
      expect(convertToUnit(1000, 'sqft', 'sqft')).toBe(1000);
      expect(convertToUnit(5, 'acres', 'acres')).toBe(5);
      expect(convertToUnit(2, 'hectare', 'hectare')).toBe(2);
    });

    it('converts sqft to acres correctly', () => {
      const sqft = 43560; // 1 acre
      const acres = convertToUnit(sqft, 'sqft', 'acres');
      expect(acres).toBeCloseTo(1, 2);
    });

    it('converts acres to sqft correctly', () => {
      const acres = 1;
      const sqft = convertToUnit(acres, 'acres', 'sqft');
      expect(sqft).toBe(43560);
    });

    it('converts sqft to hectare correctly', () => {
      const sqft = 107639; // ~1 hectare (43560 * 2.471)
      const hectare = convertToUnit(sqft, 'sqft', 'hectare');
      expect(hectare).toBeCloseTo(1, 1);
    });

    it('converts hectare to sqft correctly', () => {
      const hectare = 1;
      const sqft = convertToUnit(hectare, 'hectare', 'sqft');
      // 1 hectare = 43560 * 2.471 = 107636.76 sqft (approximately)
      expect(sqft).toBeCloseTo(107636.76, 1);
    });

    it('handles unknown units by returning original value', () => {
      expect(convertToUnit(100, 'unknown', 'sqft')).toBe(100);
      expect(convertToUnit(100, 'sqft', 'unknown')).toBe(100);
    });
  });

  describe('calculateTotal', () => {
    it('returns the rate directly when rateType is "total"', () => {
      expect(calculateTotal(1000000, 'total', 1000, 'sqft')).toBe(1000000);
    });

    it('calculates total for per_sqft rate correctly', () => {
      const rate = 100; // ₹100 per sqft
      const size = 1000; // 1000 sqft
      const total = calculateTotal(rate, 'per_sqft', size, 'sqft');
      expect(total).toBe(100000); // 100 * 1000
    });

    it('calculates total for per_sqft rate with different size unit', () => {
      const rate = 100; // ₹100 per sqft
      const size = 1; // 1 acre = 43560 sqft
      const total = calculateTotal(rate, 'per_sqft', size, 'acres');
      expect(total).toBe(4356000); // 100 * 43560
    });

    it('calculates total for per_acre rate correctly', () => {
      const rate = 1000000; // ₹10 lakh per acre
      const size = 2; // 2 acres
      const total = calculateTotal(rate, 'per_acre', size, 'acres');
      expect(total).toBe(2000000); // 1000000 * 2
    });

    it('calculates total for per_hectare rate correctly', () => {
      const rate = 2000000; // ₹20 lakh per hectare
      const size = 1; // 1 hectare
      const total = calculateTotal(rate, 'per_hectare', size, 'hectare');
      expect(total).toBe(2000000);
    });

    it('returns null when rate is 0', () => {
      expect(calculateTotal(0, 'per_sqft', 1000, 'sqft')).toBeNull();
    });

    it('returns null when size is 0', () => {
      expect(calculateTotal(100, 'per_sqft', 0, 'sqft')).toBeNull();
    });

    it('returns null for unknown rateType', () => {
      expect(calculateTotal(100, 'unknown', 1000, 'sqft')).toBeNull();
    });
  });

  describe('calculateRatePerUnit', () => {
    it('returns rate and unit for per_sqft rateType', () => {
      const result = calculateRatePerUnit(100, 'per_sqft', 1000, 'sqft');
      expect(result).toEqual({ value: 100, unit: 'sqft' });
    });

    it('returns rate and unit for per_acre rateType', () => {
      const result = calculateRatePerUnit(1000000, 'per_acre', 2, 'acres');
      expect(result).toEqual({ value: 1000000, unit: 'acres' });
    });

    it('converts total rate to per-unit rate', () => {
      const total = 1000000;
      const size = 1000;
      const result = calculateRatePerUnit(total, 'total', size, 'sqft');
      expect(result).toEqual({ value: 1000, unit: 'sqft' }); // 1000000 / 1000
    });

    it('returns null when rate is 0', () => {
      expect(calculateRatePerUnit(0, 'per_sqft', 1000, 'sqft')).toBeNull();
    });

    it('returns null when size is 0', () => {
      expect(calculateRatePerUnit(100, 'per_sqft', 0, 'sqft')).toBeNull();
    });

    it('returns null for unknown rateType', () => {
      expect(calculateRatePerUnit(100, 'unknown', 1000, 'sqft')).toBeNull();
    });
  });
});
