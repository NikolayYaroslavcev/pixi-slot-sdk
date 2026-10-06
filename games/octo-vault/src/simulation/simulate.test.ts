import { describe, expect, it } from 'vitest';
import { bonusBuyConfig } from '../config/features.config';
import { formatReport } from './report';
import { simulateBonusBuys, simulateSpins } from './simulate';

const bet = 100;

describe('simulateSpins', () => {
  const stats = simulateSpins(2000, bet, 1);

  it('gives the same numbers for the same seed, other numbers for another', () => {
    expect(simulateSpins(2000, bet, 1)).toEqual(stats);
    expect(simulateSpins(2000, bet, 2)).not.toEqual(stats);
  });

  it('adds up: RTP is win over bet, split between the base game and free spins', () => {
    expect(stats.totalBet).toBe(2000 * bet);
    expect(stats.rtp).toBeCloseTo(stats.totalWin / stats.totalBet, 10);
    expect(stats.baseRtp + stats.freeSpinsRtp).toBeCloseTo(stats.rtp, 10);
  });

  it('keeps every frequency a share of the rounds', () => {
    const frequencies = [
      stats.hitFrequency,
      stats.scatterFrequency,
      stats.freeSpinsFrequency,
      stats.bigWinFrequency,
      stats.megaWinFrequency,
    ];
    for (const frequency of frequencies) {
      expect(frequency).toBeGreaterThanOrEqual(0);
      expect(frequency).toBeLessThanOrEqual(1);
    }
    expect(stats.freeSpinsFrequency).toBeLessThanOrEqual(stats.scatterFrequency);
  });
});

describe('simulateBonusBuys', () => {
  const stats = simulateBonusBuys(200, bet, 3);

  it('pays the configured price for every purchase', () => {
    expect(stats.price).toBe(bet * bonusBuyConfig.priceInBets);
    expect(stats.totalCost).toBe(200 * stats.price);
    expect(stats.rtp).toBeCloseTo(stats.totalWin / stats.totalCost, 10);
  });

  it('gives the same numbers for the same seed', () => {
    expect(simulateBonusBuys(200, bet, 3)).toEqual(stats);
  });
});

describe('formatReport', () => {
  it('lists the figures of both parts', () => {
    const report = formatReport(simulateSpins(100, bet, 1), simulateBonusBuys(10, bet, 1));

    for (const line of ['RTP', 'hit frequency', 'free spins', 'Big Win', 'Mega Win', 'Bonus Buy']) {
      expect(report).toContain(line);
    }
  });
});
