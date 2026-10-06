import { paylines } from '../config/paylines';
import type { SymbolGrid, SymbolId } from '../config/symbols';

// Helpers for the math tests. Not used by the game.

const lowColumn: SymbolId[] = ['shell', 'starfish', 'seahorse', 'fish'];
const highColumn: SymbolId[] = ['pearl', 'anchor', 'chest', 'crown'];

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
