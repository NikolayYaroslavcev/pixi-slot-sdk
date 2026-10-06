import type { CellPosition } from 'slot-sdk';
import type { SymbolGrid } from '../config/symbols';
import type { MultiplierGrid } from './field';
import { findScatters } from './findScatters';
import { evaluateLines, type LineWin } from './lineWins';

/** Everything the rules say about one field. */
export interface SpinOutcome {
  wins: LineWin[];
  /** Sum of the line wins, minor units. */
  totalWin: number;
  /** Cells with a Scatter. 3 or more of them start free spins. */
  scatters: CellPosition[];
}

/**
 * Evaluates a field for a total `bet` in minor units, with the multipliers of its Wilds.
 * Pure: same input, same outcome.
 */
export function evaluateSpin(
  grid: SymbolGrid,
  bet: number,
  multipliers: MultiplierGrid = [],
): SpinOutcome {
  const wins = evaluateLines(grid, bet, multipliers);
  return {
    wins,
    totalWin: wins.reduce((sum, win) => sum + win.amount, 0),
    scatters: findScatters(grid),
  };
}
