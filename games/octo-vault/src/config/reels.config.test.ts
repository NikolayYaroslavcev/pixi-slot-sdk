import { describe, expect, it } from 'vitest';
import { reelsConfig } from './reels.config';
import { symbols, type SymbolId } from './symbols';

describe('Octo Vault reel strips', () => {
  const { strips, size, motion } = reelsConfig;

  it('has a strip per reel, each longer than the visible rows', () => {
    expect(strips).toHaveLength(size.reelCount);
    for (const strip of strips) {
      expect(strip.length).toBeGreaterThan(size.rowCount);
      expect(strip.every((symbolId: SymbolId) => Object.hasOwn(symbols, symbolId))).toBe(true);
    }
  });

  it('has the Octopus only on reels 2–4 and the Key on every reel', () => {
    strips.forEach((strip, reelIndex) => {
      expect(strip.includes('octopus')).toBe(reelIndex >= 1 && reelIndex <= 3);
      expect(strip).toContain('key');
    });
  });

  it('shows every symbol while spinning', () => {
    expect(new Set(strips.flat())).toEqual(new Set(Object.keys(symbols)));
  });

  it('stops all reels within about 2 seconds of a spin that is stopped right away', () => {
    const lastReel = size.reelCount - 1;
    const lastStopMs =
      motion.minimumSpinMs + lastReel * motion.stopDelayMs + motion.decelerateMs + motion.bounceMs;
    expect(lastStopMs).toBeGreaterThanOrEqual(1500);
    expect(lastStopMs).toBeLessThanOrEqual(2000);
  });
});
