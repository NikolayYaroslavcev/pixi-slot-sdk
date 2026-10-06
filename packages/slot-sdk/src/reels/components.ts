import { defineComponent } from '../ecs/component';
import type { ReelMotionData } from './reelMotion';

/** A cell of the field. Reels count from the left, rows from the top, both from 0. */
export interface CellPosition {
  reelIndex: number;
  rowIndex: number;
}

/** Marks a reel entity. */
export const Reel = defineComponent<{ reelIndex: number }>('Reel');

/**
 * Symbols of a reel in the order they pass the window, repeated endlessly.
 * Strings for the same reason as `SymbolKind`.
 */
export const ReelStrip = defineComponent<{ symbols: readonly string[] }>('ReelStrip');

/** How a reel moves right now. `ReelMotionSystem` changes it, `ReelGridView` draws it. */
export const ReelMotion = defineComponent<ReelMotionData>('ReelMotion');

/** The cell a symbol entity stands in. */
export const GridPosition = defineComponent<CellPosition>('GridPosition');

/**
 * Which symbol an entity shows. The id is a plain string here: the SDK does not know
 * the game's symbols. `ReelGrid<SymbolId>` types it for the game.
 */
export const SymbolKind = defineComponent<{ symbolId: string }>('SymbolKind');

/**
 * Keeps a symbol in its cell while the reel spins: the reel moves around it, and landing
 * leaves the entity and every component on it as they are. A game adds it to a symbol entity
 * for as long as the symbol must stay, e.g. a symbol that stays through several spins.
 */
export const Held = defineComponent<Record<string, never>>('Held');
