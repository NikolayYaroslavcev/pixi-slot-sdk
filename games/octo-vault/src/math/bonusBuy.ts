import type { Rng } from 'slot-sdk';
import { bonusBuyConfig, type BonusBuySettings } from '../config/features.config';
import { freeSpinsSteps, playFreeSpins } from './freeSpins';
import type { PlayedRound } from './playRound';

/** What buying the bonus costs at this bet, minor units. One rule for the client and the server. */
export function bonusPrice(bet: number, settings: BonusBuySettings = bonusBuyConfig): number {
  return bet * settings.priceInBets;
}

/**
 * A bought round: free spins right away, without a paid spin before them.
 * The spins are paid like any other series, at `bet`.
 */
export function playBonusRound(
  bet: number,
  rng: Rng,
  settings: BonusBuySettings = bonusBuyConfig,
): PlayedRound {
  const freeSpins = playFreeSpins(settings.freeSpins, bet, rng);
  const totalWin = freeSpins.totalWin;
  return {
    steps: [...freeSpinsSteps(freeSpins, []), { type: 'totalWin', amount: totalWin }],
    totalWin,
    freeSpins,
  };
}
