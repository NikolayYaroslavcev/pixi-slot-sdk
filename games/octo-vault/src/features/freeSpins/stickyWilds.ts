import { Held, type ReelGrid, type World } from 'slot-sdk';
import { wildSymbol, type SymbolId } from '../../config/symbols';
import type { StickyWild } from '../../math/playSpin';
import { Multiplier } from '../../scene/Multiplier';

/**
 * Holds the sticky Wilds of the coming free spin: each cell shows a Wild with its multiplier
 * and gets `Held`, so the reels spin around it and landing keeps it. The list comes from the
 * round script; on the client the components are the only record of which cells stick.
 */
export function holdStickyWilds(
  world: World,
  grid: ReelGrid<SymbolId>,
  sticky: readonly StickyWild[],
): void {
  for (const { cell, multiplier } of sticky) {
    grid.setSymbol(cell, wildSymbol);
    const symbol = grid.symbolEntity(cell);
    world.add(symbol, Held, {});
    if (multiplier > 0) {
      world.add(symbol, Multiplier, { value: multiplier });
    }
  }
}

/** Lets every held symbol go: the next landing replaces it like any other. */
export function releaseStickyWilds(world: World): void {
  for (const symbol of world.query(Held)) {
    world.remove(symbol, Held);
  }
}
