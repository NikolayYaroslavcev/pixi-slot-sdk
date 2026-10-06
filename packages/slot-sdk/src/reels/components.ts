import { defineComponent } from '../ecs/component';

/** A cell of the field. Reels count from the left, rows from the top, both from 0. */
export interface CellPosition {
  reelIndex: number;
  rowIndex: number;
}

/** Marks a reel entity. The reel's own state (motion, holds) goes into more components later. */
export const Reel = defineComponent<{ reelIndex: number }>('Reel');

/** The cell a symbol entity stands in. */
export const GridPosition = defineComponent<CellPosition>('GridPosition');

/**
 * Which symbol an entity shows. The id is a plain string here: the SDK does not know
 * the game's symbols. `ReelGrid<SymbolId>` types it for the game.
 */
export const SymbolKind = defineComponent<{ symbolId: string }>('SymbolKind');
