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
    x: position.reelIndex * (metrics.cellWidth + metrics.gap) + metrics.cellWidth / 2,
    y: position.rowIndex * (metrics.cellHeight + metrics.gap) + metrics.cellHeight / 2,
  };
}
