import type { CellPosition } from 'slot-sdk';
import { isScatter, type SymbolGrid } from '../config/symbols';

/** Cells with a Scatter, reel by reel, top to bottom. Scatters count in any position. */
export function findScatters(grid: SymbolGrid): CellPosition[] {
  return grid.flatMap((column, reelIndex) =>
    column.flatMap((symbolId, rowIndex) => (isScatter(symbolId) ? [{ reelIndex, rowIndex }] : [])),
  );
}
