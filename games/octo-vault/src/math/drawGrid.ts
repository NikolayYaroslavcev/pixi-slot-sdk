import { randomIndex, type Rng } from 'slot-sdk';
import { reelsConfig } from '../config/reels.config';
import type { SymbolGrid, SymbolId } from '../config/symbols';

/**
 * A random landing of the reels: each reel stops at a random position of its strip and shows
 * the next `rowCount` symbols from the top, wrapping past the end of the strip.
 */
export function drawGrid(rng: Rng): SymbolGrid {
  const { strips, size } = reelsConfig;
  return strips.map((strip) => {
    const stop = randomIndex(rng, strip.length);
    return Array.from(
      { length: size.rowCount },
      (_row, rowIndex) => strip[(stop + rowIndex) % strip.length] as SymbolId,
    );
  });
}
