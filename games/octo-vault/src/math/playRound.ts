import type { Rng } from 'slot-sdk';
import type { SymbolGrid } from '../config/symbols';
import { drawGrid } from './drawGrid';
import { freeSpinsFor, freeSpinsSteps, playFreeSpins, type FreeSpinsSeries } from './freeSpins';
import { playSpin, spinSteps, type SpinResult } from './playSpin';
import type { OctoVaultStep } from './steps';

/** A whole round by the rules: what happened and the script that shows it. */
export interface PlayedRound {
  readonly steps: readonly OctoVaultStep[];
  /** Everything the round won, free spins included, minor units. */
  readonly totalWin: number;
  readonly base: SpinResult;
  /** Present when the Scatters started free spins. */
  readonly freeSpins?: FreeSpinsSeries;
}

/**
 * A paid spin and the free spins its Scatters start. `drawn` replaces the random landing
 * of the base spin, so a scenario can play a fixed field; free spins always land at random.
 * Pure: the same `rng` gives the same round. The mock server and the simulation both use it.
 */
export function playRound(bet: number, rng: Rng, drawn: SymbolGrid = drawGrid(rng)): PlayedRound {
  const base = playSpin(drawn, bet, rng);
  const { scatters } = base.outcome;
  const count = freeSpinsFor(scatters.length);
  const freeSpins = count > 0 ? playFreeSpins(count, bet, rng) : undefined;
  const totalWin = base.outcome.totalWin + (freeSpins?.totalWin ?? 0);
  const steps: OctoVaultStep[] = [
    ...spinSteps(base),
    ...(freeSpins ? freeSpinsSteps(freeSpins, scatters) : []),
    { type: 'totalWin', amount: totalWin },
  ];
  return { steps, totalWin, base, ...(freeSpins && { freeSpins }) };
}
