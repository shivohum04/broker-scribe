import { describe, it, expect } from 'vitest';
import {
  formatRateInLakhsCrores,
  formatRateWithType,
} from '@/lib/rate-formatter';

describe('Rate Formatter', () => {
  describe('formatRateInLakhsCrores', () => {
    it('returns "Price on request" for zero rate', () => {
      expect(formatRateInLakhsCrores(0)).toBe('Price on request');
    });

    it('formats amounts less than 1 lakh in regular currency format', () => {
      const result = formatRateInLakhsCrores(50000);
      expect(result).toContain('₹');
      expect(result).toContain('50');
    });

    it('formats 1 lakh correctly', () => {
      const result = formatRateInLakhsCrores(100000);
      expect(result).toBe('1.0 Lakh');
    });

    it('formats amounts in lakhs correctly', () => {
      expect(formatRateInLakhsCrores(500000)).toBe('5.0 Lakh');
      expect(formatRateInLakhsCrores(1250000)).toBe('12.5 Lakh');
      expect(formatRateInLakhsCrores(9999999)).toBe('100.0 Lakh'); // Rounds to 100 lakh
    });

    it('formats 1 crore correctly', () => {
      const result = formatRateInLakhsCrores(10000000);
      expect(result).toBe('1.0 Crore');
    });

    it('formats amounts in crores correctly', () => {
      expect(formatRateInLakhsCrores(15000000)).toBe('1.5 Crore');
      expect(formatRateInLakhsCrores(25000000)).toBe('2.5 Crore');
      expect(formatRateInLakhsCrores(100000000)).toBe('10.0 Crore');
    });

    it('handles decimal precision correctly (one decimal place)', () => {
      const result1 = formatRateInLakhsCrores(1250000);
      expect(result1).toBe('12.5 Lakh');
      
      const result2 = formatRateInLakhsCrores(15000000);
      expect(result2).toBe('1.5 Crore');
    });
  });

  describe('formatRateWithType', () => {
    it('returns "Price on request" for zero rate', () => {
      expect(formatRateWithType(0, 'total')).toBe('Price on request');
      expect(formatRateWithType(0, 'per_sqft')).toBe('Price on request');
    });

    it('applies lakhs/crores formatting for total rate type', () => {
      const result = formatRateWithType(1500000, 'total');
      expect(result).toBe('15.0 Lakh');
    });

    it('formats per_sqft rate with unit suffix', () => {
      const result = formatRateWithType(100, 'per_sqft');
      expect(result).toContain('/sq ft');
      expect(result).toContain('₹');
    });

    it('formats per_acre rate with unit suffix', () => {
      const result = formatRateWithType(1000000, 'per_acre');
      expect(result).toContain('/acre');
      expect(result).toContain('₹');
    });

    it('formats per_hectare rate with unit suffix', () => {
      const result = formatRateWithType(2000000, 'per_hectare');
      expect(result).toContain('/hectare');
      expect(result).toContain('₹');
    });

    it('handles unknown rate type by returning formatted currency', () => {
      const result = formatRateWithType(1000000, 'unknown');
      expect(result).toContain('₹');
    });
  });
});

