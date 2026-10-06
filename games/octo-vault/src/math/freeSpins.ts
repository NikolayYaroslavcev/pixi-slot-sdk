import type { CellPosition, Rng } from 'slot-sdk';
import { freeSpinsConfig, type FreeSpinsSettings } from '../config/features.config';
import { drawGrid } from './drawGrid';
import { playSpin, spinSteps, stickyWilds, type SpinResult, type StickyWild } from './playSpin';
import type { OctoVaultStep } from './steps';

/** One free spin and the sticky Wilds it started with. */
export interface FreeSpin {
  readonly sticky: readonly StickyWild[];
  readonly spin: SpinResult;
}

export interface FreeSpinsSeries {
  readonly spins: readonly FreeSpin[];
  /** Minor units. */
  readonly totalWin: number;
}

/** Free spins for this many Scatters on the field; 0 when they start none. */
export function freeSpinsFor(
  scatterCount: number,
  settings: FreeSpinsSettings = freeSpinsConfig,
): number {
  let spins = 0;
  for (const level of settings.spinsByScatters) {
    if (scatterCount >= level.scatters) {
      spins = level.spins;
    }
  }
  return spins;
}

/**
 * A whole series. Every Wild on the field after a spin, with its multiplier, stays in place for
 * the next spins. The bet is not taken again, and Scatters inside the series start nothing.
 */
export function playFreeSpins(count: number, bet: number, rng: Rng): FreeSpinsSeries {
  const spins: FreeSpin[] = [];
  let sticky: StickyWild[] = [];
  for (let index = 0; index < count; index += 1) {
    const spin = playSpin(drawGrid(rng), bet, rng, sticky);
    spins.push({ sticky, spin });
    sticky = stickyWilds(spin.field);
  }
  return { spins, totalWin: spins.reduce((sum, { spin }) => sum + spin.outcome.totalWin, 0) };
}

/** The series as the player sees it: the intro, before every spin its update, the summary. */
export function freeSpinsSteps(
  series: FreeSpinsSeries,
  scatters: readonly CellPosition[],
): OctoVaultStep[] {
  const count = series.spins.length;
  const steps: OctoVaultStep[] = [{ type: 'freeSpinsStart', count, scatters }];
  let seriesWin = 0;
  series.spins.forEach(({ sticky, spin }, index) => {
    steps.push({ type: 'freeSpinsUpdate', spin: index + 1, count, seriesWin, sticky });
    steps.push(...spinSteps(spin));
    seriesWin += spin.outcome.totalWin;
  });
  steps.push({ type: 'freeSpinsEnd', count, seriesWin });
  return steps;
}
