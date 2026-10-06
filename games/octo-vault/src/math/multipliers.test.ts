import type { CellPosition } from 'slot-sdk';
import { describe, expect, it } from 'vitest';
import { paytable } from '../config/paytable';
import type { SymbolGrid } from '../config/symbols';
import { evaluateSpin } from './evaluateSpin';
import { plainField, type MultiplierGrid } from './field';
import { evaluateLines } from './lineWins';
import { gridWithLine } from './testGrids';

const bet = 100;

/** Multipliers of `grid` with `values` put on cells: `[reelIndex, rowIndex, value]`. */
function multipliersOf(grid: SymbolGrid, values: [number, number, number][]): MultiplierGrid {
  const multipliers = plainField(grid).multipliers.map((column) => [...column]);
  for (const [reelIndex, rowIndex, value] of values) {
    const column = multipliers[reelIndex];
    if (column) {
      column[rowIndex] = value;
    }
  }
  return multipliers;
}

function includesCell(cells: readonly CellPosition[], cell: CellPosition): boolean {
  return cells.some(
    ({ reelIndex, rowIndex }) => reelIndex === cell.reelIndex && rowIndex === cell.rowIndex,
  );
}

describe('Wild multipliers on lines', () => {
  const fourAnchors = gridWithLine(0, ['anchor', 'octopus', 'octopus', 'anchor']);
  const anchorPay = bet * paytable.anchor[4];

  it('add up on a winning line and multiply its pay', () => {
    const multipliers = multipliersOf(fourAnchors, [
      [1, 0, 2],
      [2, 0, 3],
    ]);
    const [win] = evaluateLines(fourAnchors, bet, multipliers);

    expect(win?.multiplier).toBe(5);
    expect(win?.amount).toBe(anchorPay * 5);
  });

  it('count a plain Octopus as no multiplier next to a grabbed Wild', () => {
    const [win] = evaluateLines(fourAnchors, bet, multipliersOf(fourAnchors, [[2, 0, 3]]));

    expect(win?.multiplier).toBe(3);
    expect(win?.amount).toBe(anchorPay * 3);
  });

  it('pay ×1 without multipliers', () => {
    const [win] = evaluateLines(fourAnchors, bet, plainField(fourAnchors).multipliers);

    expect(win?.multiplier).toBe(1);
    expect(win?.amount).toBe(anchorPay);
  });

  it('only count on the matching cells of the line', () => {
    // The 5th cell is a Wild with ×5, but the line ends at the Scatter on reel 4.
    const grid = gridWithLine(0, ['anchor', 'octopus', 'anchor', 'key', 'octopus']);
    const [win] = evaluateLines(grid, bet, multipliersOf(grid, [[4, 0, 5]]));

    expect(win?.count).toBe(3);
    expect(win?.multiplier).toBe(1);
  });

  it('multiply every line through the Wild once, and nothing else', () => {
    // Lines 1 (top row) and 13 (0, 1, 0, 1, 0) both pass the ×2 Wild on reel 3.
    const wild = { reelIndex: 2, rowIndex: 0 };
    const grid = gridWithLine(
      12,
      ['pearl', 'pearl'],
      gridWithLine(0, ['pearl', 'pearl', 'octopus']),
    );
    const outcome = evaluateSpin(grid, bet, multipliersOf(grid, [[2, 0, 2]]));
    const throughWild = outcome.wins.filter((win) => includesCell(win.cells, wild));

    expect(throughWild.length).toBeGreaterThanOrEqual(2);
    for (const win of outcome.wins) {
      const multiplier = includesCell(win.cells, wild) ? 2 : 1;
      expect(win.multiplier).toBe(multiplier);
      expect(win.amount).toBe(Math.round(bet * paytable[win.symbolId][win.count] * multiplier));
    }
    expect(outcome.totalWin).toBe(outcome.wins.reduce((sum, win) => sum + win.amount, 0));
  });
});
