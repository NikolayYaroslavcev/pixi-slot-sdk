import { pickWeighted, randomIndex, type CellPosition, type Rng } from 'slot-sdk';
import type { TentacleGrabSettings } from '../config/features.config';
import { isScatter, isWild, wildSymbol, type SymbolId } from '../config/symbols';
import type { Field } from './field';

/** One tentacle: the cell it grabbed and the multiplier that cell has after the grab. */
export interface TentacleHit {
  readonly cell: CellPosition;
  readonly multiplier: number;
}

/** The tentacles of one Octopus, in the order they are thrown. */
export interface TentacleGrab {
  readonly from: CellPosition;
  readonly hits: readonly TentacleHit[];
}

export interface GrabResult {
  /** The field after every tentacle: grabbed cells are Wilds with their multipliers. */
  readonly field: Field;
  readonly grabs: readonly TentacleGrab[];
}

/**
 * The Grab. Each Octopus of `sources` throws tentacles at random cells of `field`; a grabbed cell
 * becomes a Wild and its multiplier grows by the tentacle's multiplier, so a cell grabbed twice
 * adds both. A tentacle never grabs a Scatter, nor a cell that was already a Wild before the Grab:
 * those keep what they are. Pure: the same field and the same `rng` give the same result.
 */
export function grabTentacles(
  field: Field,
  sources: readonly CellPosition[],
  rng: Rng,
  settings: TentacleGrabSettings,
): GrabResult {
  const grid = field.grid.map((column) => [...column]);
  const multipliers = field.multipliers.map((column) => [...column]);
  const targets = grabbableCells(field.grid);
  const grabs = sources.map((from) => {
    const count = targets.length > 0 ? pickWeighted(rng, settings.tentacles) : 0;
    const hits = Array.from({ length: count }, (): TentacleHit => {
      const cell = targets[randomIndex(rng, targets.length)] as CellPosition;
      const { reelIndex, rowIndex } = cell;
      const multiplier =
        (multipliers[reelIndex]?.[rowIndex] ?? 0) + pickWeighted(rng, settings.multipliers);
      setCell(grid, cell, wildSymbol);
      setCell(multipliers, cell, multiplier);
      return { cell, multiplier };
    });
    return { from, hits };
  });
  return { field: { grid, multipliers }, grabs };
}

/** Cells a tentacle may grab: everything except Scatters and the Wilds already on the field. */
function grabbableCells(grid: readonly (readonly SymbolId[])[]): CellPosition[] {
  return grid.flatMap((column, reelIndex) =>
    column.flatMap((symbolId, rowIndex) =>
      isScatter(symbolId) || isWild(symbolId) ? [] : [{ reelIndex, rowIndex }],
    ),
  );
}

function setCell<Value>(grid: Value[][], cell: CellPosition, value: Value): void {
  const column = grid[cell.reelIndex];
  if (column) {
    column[cell.rowIndex] = value;
  }
}
