import type { ReelGridSize, ReelGridViewOptions } from 'slot-sdk';
import type { SymbolId } from './symbols';

interface ReelsConfig {
  size: ReelGridSize;
  /** Sizes in design coordinates. `layout.ts` places and scales the whole field. */
  view: ReelGridViewOptions;
  /** What the field shows before the first spin, one array per reel from the top. */
  initialSymbols: readonly (readonly SymbolId[])[];
}

export const reelsConfig: ReelsConfig = {
  size: { reelCount: 5, rowCount: 4 },
  view: { cellWidth: 170, cellHeight: 170, gap: 12, padding: 28, panelColor: '#0a2c44' },
  // Every symbol once or twice, the Octopus only on reels 2–4 as the rules allow.
  initialSymbols: [
    ['shell', 'pearl', 'starfish', 'key'],
    ['anchor', 'octopus', 'fish', 'seahorse'],
    ['crown', 'chest', 'shell', 'pearl'],
    ['starfish', 'key', 'octopus', 'anchor'],
    ['fish', 'seahorse', 'crown', 'chest'],
  ],
};
