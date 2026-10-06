import type { CellPosition } from 'slot-sdk';
import { isWild, type SymbolGrid } from '../config/symbols';

/** Multiplier of each cell, one array per reel from the top. 0: the cell has none. */
export type MultiplierGrid = readonly (readonly number[])[];

/**
 * The field the lines are paid on: the symbols after every change of the round
 * (Grab, sticky Wilds) and the multipliers of its Wilds. It is the one input of the line math.
 */
export interface Field {
  readonly grid: SymbolGrid;
  readonly multipliers: MultiplierGrid;
}

/** A field of `grid` without multipliers. */
export function plainField(grid: SymbolGrid): Field {
  return { grid, multipliers: grid.map((column) => column.map(() => 0)) };
}

export function multiplierAt(multipliers: MultiplierGrid, cell: CellPosition): number {
  return multipliers[cell.reelIndex]?.[cell.rowIndex] ?? 0;
}

/** Cells with a Wild, reel by reel, top to bottom. */
export function wildCells(grid: SymbolGrid): CellPosition[] {
  return grid.flatMap((column, reelIndex) =>
    column.flatMap((symbolId, rowIndex) => (isWild(symbolId) ? [{ reelIndex, rowIndex }] : [])),
  );
}

export function sameCell(first: CellPosition, second: CellPosition): boolean {
  return first.reelIndex === second.reelIndex && first.rowIndex === second.rowIndex;
}
