import type { Rng, WinsStep } from 'slot-sdk';
import { tentacleGrabConfig } from '../config/features.config';
import type { SymbolGrid } from '../config/symbols';
import { evaluateSpin, type SpinOutcome } from './evaluateSpin';
import { plainField, wildCells, type Field } from './field';
import type { LineWin } from './lineWins';
import type { OctoVaultStep } from './steps';
import { grabTentacles, type TentacleGrab } from './tentacleGrab';

/** One spin from the landing of the reels to its wins. */
export interface SpinResult {
  /** Where the reels stopped. */
  readonly landed: SymbolGrid;
  readonly grabs: readonly TentacleGrab[];
  /** The field the lines are paid on, after the Grab. */
  readonly field: Field;
  readonly outcome: SpinOutcome;
}

/**
 * The rules of one spin: every Octopus that landed grabs, then the lines are paid on the changed
 * field with its multipliers. The order is the order of the round, so `rng` is read the same way
 * by the game, the tests and the simulation.
 */
export function playSpin(landed: SymbolGrid, bet: number, rng: Rng): SpinResult {
  const { field, grabs } = grabTentacles(
    plainField(landed),
    wildCells(landed),
    rng,
    tentacleGrabConfig,
  );
  const outcome = evaluateSpin(field.grid, bet, field.multipliers);
  return { landed, grabs, field, outcome };
}

/** What the player sees of a spin: the reels land, the Octopuses grab, the lines pay. */
export function spinSteps(spin: SpinResult): OctoVaultStep[] {
  const steps: OctoVaultStep[] = [{ type: 'reveal', grid: spin.landed }];
  if (spin.grabs.some((grab) => grab.hits.length > 0)) {
    steps.push({ type: 'tentacles', grabs: spin.grabs });
  }
  if (spin.outcome.wins.length > 0) {
    steps.push(winsStep(spin.outcome.wins, spin.outcome.totalWin));
  }
  return steps;
}

function winsStep(wins: readonly LineWin[], amount: number): WinsStep {
  return {
    type: 'wins',
    // The multiplier is shown with the amount of its line.
    wins: wins.map((win) =>
      win.multiplier > 1 ? { ...win, caption: `×${String(win.multiplier)}` } : win,
    ),
    amount,
  };
}
