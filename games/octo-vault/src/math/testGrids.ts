import type { CellPosition, Rng } from 'slot-sdk';
import { paylines } from '../config/paylines';
import type { SymbolGrid, SymbolId } from '../config/symbols';

// Helpers for the math tests. Not used by the game.

const lowColumn: SymbolId[] = ['jack', 'queen', 'king', 'ace'];
const highColumn: SymbolId[] = ['bottle', 'anchor', 'wheel', 'skull'];

/**
 * A field without a single win: neighbouring reels never share a symbol,
 * so no line gets even 2 in a row.
 */
export const noWinGrid: SymbolGrid = [lowColumn, highColumn, lowColumn, highColumn, lowColumn];

/** `noWinGrid` with `symbolIds` put along a payline, from the first reel. */
export function gridWithLine(
  lineIndex: number,
  symbolIds: readonly SymbolId[],
  grid: SymbolGrid = noWinGrid,
): SymbolGrid {
  const line = paylines[lineIndex];
  if (!line) {
    throw new Error(`gridWithLine: no payline ${String(lineIndex)}`);
  }
  return grid.map((column, reelIndex) => {
    const symbolId = symbolIds[reelIndex];
    const rowIndex = line[reelIndex];
    if (symbolId === undefined || rowIndex === undefined) {
      return column;
    }
    return column.map((cell, row) => (row === rowIndex ? symbolId : cell));
  });
}

/** A field of one symbol in every cell. */
export function gridOf(symbolId: SymbolId): SymbolGrid {
  return noWinGrid.map((column) => column.map(() => symbolId));
}

/** `grid` with `symbolId` put in the cell. */
export function withSymbol(
  grid: SymbolGrid,
  { reelIndex, rowIndex }: CellPosition,
  symbolId: SymbolId,
): SymbolGrid {
  return grid.map((column, reel) =>
    reel === reelIndex ? column.map((cell, row) => (row === rowIndex ? symbolId : cell)) : column,
  );
}

/** An Rng that returns `values` in turn, so a test decides every random choice. */
export function scriptedRng(values: readonly number[]): Rng {
  let index = 0;
  return {
    next() {
      const value = values[index];
      if (value === undefined) {
        throw new Error(`scriptedRng: only ${String(values.length)} values were given`);
      }
      index += 1;
      return value;
    },
  };
}
