import { describe, expect, it } from 'vitest';
import { formatMoney, isMinorUnits } from './money';

describe('isMinorUnits', () => {
  it('accepts whole non-negative numbers only', () => {
    expect(isMinorUnits(0)).toBe(true);
    expect(isMinorUnits(150)).toBe(true);
    expect(isMinorUnits(1.5)).toBe(false);
    expect(isMinorUnits(-1)).toBe(false);
    expect(isMinorUnits('100')).toBe(false);
  });
});

describe('formatMoney', () => {
  it('shows minor units as an amount with two decimals', () => {
    expect(formatMoney(0)).toBe('0.00');
    expect(formatMoney(5)).toBe('0.05');
    expect(formatMoney(150)).toBe('1.50');
  });

  it('separates thousands', () => {
    expect(formatMoney(123_456_789)).toBe('1,234,567.89');
  });
});
