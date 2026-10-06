import { describe, expect, it } from 'vitest';
import { assets } from '../assets';
import { reelsConfig } from './reels.config';
import { symbols, type SymbolId, type SymbolTier } from './symbols';

function idsOfTier(tier: SymbolTier): string[] {
  return Object.entries(symbols)
    .filter(([, symbol]) => symbol.tier === tier)
    .map(([symbolId]) => symbolId);
}

describe('Octo Vault symbols', () => {
  it('has 4 low, 4 high, the Octopus Wild and the Key Scatter', () => {
    expect(idsOfTier('low')).toHaveLength(4);
    expect(idsOfTier('high')).toHaveLength(4);
    expect(idsOfTier('wild')).toEqual(['octopus']);
    expect(idsOfTier('scatter')).toEqual(['key']);
  });

  it('has placeholder art for exactly the symbols of the game', () => {
    expect(Object.keys(assets.symbols).sort()).toEqual(Object.keys(symbols).sort());
  });

  it('starts with a 5 × 4 field of known symbols', () => {
    const { size, initialSymbols } = reelsConfig;

    expect(size).toEqual({ reelCount: 5, rowCount: 4 });
    expect(initialSymbols).toHaveLength(5);
    for (const column of initialSymbols) {
      expect(column).toHaveLength(4);
      expect(column.every((symbolId: SymbolId) => Object.hasOwn(symbols, symbolId))).toBe(true);
    }
  });

  it('starts with the Octopus only on reels 2–4', () => {
    const reelsWithOctopus = reelsConfig.initialSymbols
      .map((column, reelIndex) => (column.includes('octopus') ? reelIndex : -1))
      .filter((reelIndex) => reelIndex !== -1);

    expect(reelsWithOctopus.every((reelIndex) => reelIndex >= 1 && reelIndex <= 3)).toBe(true);
  });
});
