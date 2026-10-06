import { createRng } from 'slot-sdk';
import { describe, expect, it } from 'vitest';
import { bonusBuyConfig } from '../config/features.config';
import { bonusPrice, playBonusRound } from './bonusBuy';

describe('bonus round', () => {
  it('costs the configured number of bets', () => {
    expect(bonusPrice(150)).toBe(150 * bonusBuyConfig.priceInBets);
  });

  it('starts free spins right away, without a paid spin', () => {
    const round = playBonusRound(100, createRng(9));
    const types = round.steps.map((step) => step.type);

    expect(round.base).toBeUndefined();
    expect(types[0]).toBe('freeSpinsStart');
    expect(types.filter((type) => type === 'freeSpinsUpdate')).toHaveLength(
      bonusBuyConfig.freeSpins,
    );
    expect(types.slice(-2)).toEqual(['freeSpinsEnd', 'totalWin']);
    expect(round.totalWin).toBe(round.freeSpins?.totalWin);
  });
});
