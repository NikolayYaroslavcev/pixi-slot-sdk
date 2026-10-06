import type { CellPosition } from 'slot-sdk';
import type { SymbolGrid } from '../config/symbols';
import { findScatters } from './findScatters';
import { evaluateLines, type LineWin } from './lineWins';

/** Everything the rules say about one field. */
export interface SpinOutcome {
  wins: LineWin[];
  /** Sum of the line wins, minor units. */
  totalWin: number;
  /** Cells with a Scatter. Their count will start free spins (stage 10). */
  scatters: CellPosition[];
}

/** Evaluates a stopped field for a total `bet` in minor units. Pure: same input, same outcome. */
export function evaluateSpin(grid: SymbolGrid, bet: number): SpinOutcome {
  const wins = evaluateLines(grid, bet);
  return {
    wins,
    totalWin: wins.reduce((sum, win) => sum + win.amount, 0),
    scatters: findScatters(grid),
  };
}
