import type { CellPosition, Win } from 'slot-sdk';
import { paylines, type Payline } from '../config/paylines';
import { minimumMatch, paytable, wildPaysAs, type MatchCount } from '../config/paytable';
import {
  isRegularSymbol,
  isWild,
  type RegularSymbolId,
  type SymbolGrid,
  type SymbolId,
} from '../config/symbols';
import { multiplierAt, type MultiplierGrid } from './field';

/** A paying line. `cells` are only the matching cells, from the first reel. */
export interface LineWin extends Win {
  /** Index in `paylines`. */
  readonly lineIndex: number;
  /** The symbol the line pays as. */
  readonly symbolId: RegularSymbolId;
  /** Matching symbols in a row from the first reel. */
  readonly count: MatchCount;
  /** The pay of the line is multiplied by it: the sum of the Wild multipliers on its cells, or 1. */
  readonly multiplier: number;
}

/** What a line shows from the left: the symbol it pays as and how many cells match it. */
interface LineMatch {
  symbolId: RegularSymbolId;
  count: number;
}

/**
 * Wins of every payline on `grid` for a total `bet` in minor units.
 * A line pays for equal symbols in a row from the first reel, from 3 of them.
 * The Wild stands for any regular symbol, the Scatter never pays on a line.
 * Multipliers of the Wilds among the matching cells add up and multiply the line once.
 */
export function evaluateLines(
  grid: SymbolGrid,
  bet: number,
  multipliers: MultiplierGrid = [],
): LineWin[] {
  return paylines.flatMap((line, lineIndex) => {
    const { symbolId, count } = matchLine(grid, line);
    if (count < minimumMatch) {
      return [];
    }
    const matchCount = count as MatchCount;
    const cells = lineCells(line).slice(0, count);
    const multiplier = lineMultiplier(multipliers, cells);
    return [
      {
        lineIndex,
        symbolId,
        count: matchCount,
        multiplier,
        cells,
        path: lineCells(line),
        // Pays are fractions of the bet; money is rounded to whole minor units once, here.
        amount: Math.round(bet * paytable[symbolId][matchCount] * multiplier),
      },
    ];
  });
}

/** Multipliers on the matching cells add up: ×2 and ×3 make ×5. Without any, the line pays ×1. */
function lineMultiplier(multipliers: MultiplierGrid, cells: readonly CellPosition[]): number {
  const sum = cells.reduce((total, cell) => total + multiplierAt(multipliers, cell), 0);
  return Math.max(sum, 1);
}

/**
 * Walks the line from the left while the cells match. Wilds match anything regular,
 * the first regular symbol decides what the line pays as. A line of only Wilds pays as `wildPaysAs`.
 */
function matchLine(grid: SymbolGrid, line: Payline): LineMatch {
  let paying: RegularSymbolId | undefined;
  let count = 0;
  for (const [reelIndex, rowIndex] of line.entries()) {
    const symbolId = symbolAt(grid, { reelIndex, rowIndex });
    if (!continuesMatch(symbolId, paying)) {
      break;
    }
    if (isRegularSymbol(symbolId)) {
      paying = symbolId;
    }
    count += 1;
  }
  return { symbolId: paying ?? wildPaysAs, count };
}

function continuesMatch(symbolId: SymbolId, paying: RegularSymbolId | undefined): boolean {
  if (isWild(symbolId)) {
    return true;
  }
  if (!isRegularSymbol(symbolId)) {
    return false;
  }
  return paying === undefined || symbolId === paying;
}

function lineCells(line: Payline): CellPosition[] {
  return line.map((rowIndex, reelIndex) => ({ reelIndex, rowIndex }));
}

function symbolAt(grid: SymbolGrid, cell: CellPosition): SymbolId {
  const symbolId = grid[cell.reelIndex]?.[cell.rowIndex];
  if (symbolId === undefined) {
    throw new Error(
      `evaluateLines: the grid has no cell at reel ${String(cell.reelIndex)}, row ${String(cell.rowIndex)}`,
    );
  }
  return symbolId;
}
