import { describe, expect, it, vi } from 'vitest';
import { freshSeed, seedFromAddress } from './seed';

describe('seedFromAddress', () => {
  it('reads a whole number from the address', () => {
    expect(seedFromAddress('?seed=42')).toBe(42);
    expect(seedFromAddress('?scenario=win&seed=0')).toBe(0);
    expect(seedFromAddress('')).toBeUndefined();
  });

  it('ignores anything else and says so', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    for (const value of ['abc', '-1', '1.5']) {
      expect(seedFromAddress(`?seed=${value}`)).toBeUndefined();
    }
    expect(warn).toHaveBeenCalledTimes(3);
    warn.mockRestore();
  });
});

describe('freshSeed', () => {
  it('gives a whole number from 0', () => {
    const seed = freshSeed();

    expect(Number.isSafeInteger(seed) && seed >= 0).toBe(true);
  });
});
