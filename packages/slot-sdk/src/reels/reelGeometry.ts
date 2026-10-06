import type { CellPosition } from './components';
import type { ReelGridSize } from './ReelGrid';

/** Size of one cell and the space between cells, in design coordinates. */
export interface CellMetrics {
  cellWidth: number;
  cellHeight: number;
  gap: number;
}

/** Width and height of all cells together, without any frame around them. */
export function cellsSize(
  size: ReelGridSize,
  metrics: CellMetrics,
): { width: number; height: number } {
  return {
    width: size.reelCount * metrics.cellWidth + (size.reelCount - 1) * metrics.gap,
    height: size.rowCount * metrics.cellHeight + (size.rowCount - 1) * metrics.gap,
  };
}

/** Center of a cell, measured from the top left corner of the first cell. */
export function cellCenter(position: CellPosition, metrics: CellMetrics): { x: number; y: number } {
  return {
    x: reelCenterX(position.reelIndex, metrics),
    y: rowCenterY(position.rowIndex, metrics),
  };
}

export function reelCenterX(reelIndex: number, metrics: CellMetrics): number {
  return reelIndex * (metrics.cellWidth + metrics.gap) + metrics.cellWidth / 2;
}

/**
 * Vertical center of a row. While a reel moves, its symbols stand between rows,
 * so `row` may be fractional: 1.5 is halfway between rows 1 and 2.
 */
export function rowCenterY(row: number, metrics: CellMetrics): number {
  return row * (metrics.cellHeight + metrics.gap) + metrics.cellHeight / 2;
}
