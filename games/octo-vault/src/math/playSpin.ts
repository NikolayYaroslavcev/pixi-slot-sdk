import type { CellPosition, Rng, WinsStep } from 'slot-sdk';
import { tentacleGrabConfig } from '../config/features.config';
import { wildSymbol, type SymbolGrid } from '../config/symbols';
import { evaluateSpin, type SpinOutcome } from './evaluateSpin';
import { multiplierAt, plainField, sameCell, wildCells, type Field } from './field';
import type { LineWin } from './lineWins';
import type { OctoVaultStep } from './steps';
import { grabTentacles, type TentacleGrab } from './tentacleGrab';

/** A Wild that stays in its cell, with its multiplier, until the end of free spins. */
export interface StickyWild {
  readonly cell: CellPosition;
  /** 0: a plain Wild without a multiplier. */
  readonly multiplier: number;
}

/** One spin from the landing of the reels to its wins. */
export interface SpinResult {
  /** What the reels show after landing: the drawn symbols with the sticky Wilds on top. */
  readonly landed: SymbolGrid;
  readonly grabs: readonly TentacleGrab[];
  /** The field the lines are paid on, after the Grab. */
  readonly field: Field;
  readonly outcome: SpinOutcome;
}

/**
 * The rules of one spin. `drawn` is where the reels stopped; sticky Wilds stay over it with their
 * multipliers. Every Octopus that landed this spin grabs (sticky ones grabbed when they landed),
 * then the lines are paid on the changed field. The order is the order of the round, so `rng`
 * is read the same way by the game, the tests and the simulation.
 */
export function playSpin(
  drawn: SymbolGrid,
  bet: number,
  rng: Rng,
  sticky: readonly StickyWild[] = [],
): SpinResult {
  const start = withSticky(plainField(drawn), sticky);
  const sources = wildCells(drawn).filter(
    (cell) => !sticky.some((wild) => sameCell(wild.cell, cell)),
  );
  const { field, grabs } = grabTentacles(start, sources, rng, tentacleGrabConfig);
  const outcome = evaluateSpin(field.grid, bet, field.multipliers);
  return { landed: start.grid, grabs, field, outcome };
}

/** Every Wild of the field with its multiplier: what stays for the next free spin. */
export function stickyWilds(field: Field): StickyWild[] {
  return wildCells(field.grid).map((cell) => ({
    cell,
    multiplier: multiplierAt(field.multipliers, cell),
  }));
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

function withSticky(field: Field, sticky: readonly StickyWild[]): Field {
  const grid = field.grid.map((column) => [...column]);
  const multipliers = field.multipliers.map((column) => [...column]);
  for (const { cell, multiplier } of sticky) {
    const symbols = grid[cell.reelIndex];
    const values = multipliers[cell.reelIndex];
    if (symbols && values) {
      symbols[cell.rowIndex] = wildSymbol;
      values[cell.rowIndex] = multiplier;
    }
  }
  return { grid, multipliers };
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
