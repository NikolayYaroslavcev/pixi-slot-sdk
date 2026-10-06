import { describe, expect, it } from 'vitest';
import { bigWinTier, type BigWinTier } from './bigWinTier';

function tier(title: string, minBets: number): BigWinTier {
  return {
    title,
    minBets,
    countUpMs: 0,
    holdMs: 0,
    color: '#ffffff',
    titleScale: 1,
    particlesPerSecond: 0,
  };
}

// Mega first: the order of the config must not matter.
const tiers = [tier('MEGA', 25), tier('BIG', 10)];
const bet = 200;

describe('bigWinTier', () => {
  it('finds no tier below the lowest threshold', () => {
    expect(bigWinTier(10 * bet - 1, bet, tiers)).toBeUndefined();
  });

  it('reaches Big Win exactly at its threshold', () => {
    expect(bigWinTier(10 * bet, bet, tiers)?.title).toBe('BIG');
  });

  it('stays Big Win just below the Mega threshold', () => {
    expect(bigWinTier(25 * bet - 1, bet, tiers)?.title).toBe('BIG');
  });

  it('picks the highest tier reached', () => {
    expect(bigWinTier(25 * bet, bet, tiers)?.title).toBe('MEGA');
    expect(bigWinTier(1000 * bet, bet, tiers)?.title).toBe('MEGA');
  });

  it('finds nothing without tiers', () => {
    expect(bigWinTier(1000 * bet, bet, [])).toBeUndefined();
  });
});
