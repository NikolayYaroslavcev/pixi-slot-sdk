import type {
  HighlightStyle,
  ReelGridSize,
  ReelGridViewOptions,
  ReelMotionSettings,
} from 'slot-sdk';
import type { SymbolGrid, SymbolId } from './symbols';

interface ReelsConfig {
  size: ReelGridSize;
  /** Sizes in design coordinates. `layout.ts` places and scales the whole field. */
  view: ReelGridViewOptions;
  motion: ReelMotionSettings;
  /** How winning symbols stand out while wins are shown. */
  highlight: HighlightStyle;
  /** What the field shows before the first spin, one array per reel from the top. */
  initialSymbols: SymbolGrid;
  /**
   * The symbols each reel shows while it spins, in the order they pass from top to bottom.
   * A strip repeats endlessly, its last symbol is followed by the first.
   */
  strips: readonly (readonly SymbolId[])[];
}

// At this speed and above the blur is at full strength.
const maxSpeed = 24;

export const reelsConfig: ReelsConfig = {
  size: { reelCount: 5, rowCount: 4 },
  view: {
    cellWidth: 170,
    cellHeight: 170,
    gap: 12,
    padding: 28,
    panelColor: '#0a2c44',
    motionBlur: { fromSpeed: 6, fullSpeed: maxSpeed, strength: 12, quality: 3 },
  },
  // A short spin, as observed in the reference games: ~1.7 s from the start to the last reel.
  motion: {
    startSpeed: 4,
    maxSpeed,
    accelerateMs: 220,
    minimumSpinMs: 600,
    decelerateMs: 320,
    bounce: 0.12,
    bounceMs: 160,
    startDelayMs: 40,
    stopDelayMs: 170,
    // Stop pressed: the reels still land one by one, just much closer together.
    quickStopDelayMs: 60,
  },
  // Dimmed symbols stay recognisable; a winning one breathes about once a second.
  highlight: { dimBrightness: 0.3, fadeMs: 220, pulseScale: 0.1, pulseMs: 900 },
  // Every symbol once or twice, the Octopus only on reels 2–4 as the rules allow.
  initialSymbols: [
    ['shell', 'pearl', 'starfish', 'key'],
    ['anchor', 'octopus', 'fish', 'seahorse'],
    ['crown', 'chest', 'shell', 'pearl'],
    ['starfish', 'key', 'octopus', 'anchor'],
    ['fish', 'seahorse', 'crown', 'chest'],
  ],
  // Low symbols come more often than high ones. The Octopus is only on reels 2–4.
  // The payout math of stage 6 picks stops on these same strips.
  // prettier-ignore
  strips: [
    [
      'shell', 'fish', 'pearl', 'starfish', 'seahorse', 'anchor', 'shell', 'key',
      'fish', 'starfish', 'chest', 'seahorse', 'shell', 'crown', 'fish', 'starfish',
      'pearl', 'seahorse', 'anchor', 'shell', 'fish', 'chest', 'starfish', 'seahorse',
    ],
    [
      'starfish', 'shell', 'octopus', 'fish', 'seahorse', 'pearl', 'starfish', 'shell',
      'anchor', 'key', 'fish', 'seahorse', 'chest', 'starfish', 'shell', 'crown',
      'fish', 'octopus', 'seahorse', 'pearl', 'starfish', 'anchor', 'shell', 'fish',
    ],
    [
      'fish', 'seahorse', 'chest', 'shell', 'octopus', 'starfish', 'fish', 'pearl',
      'seahorse', 'shell', 'key', 'starfish', 'anchor', 'fish', 'crown', 'seahorse',
      'shell', 'octopus', 'starfish', 'chest', 'fish', 'seahorse', 'pearl', 'shell',
    ],
    [
      'seahorse', 'starfish', 'anchor', 'fish', 'shell', 'octopus', 'seahorse', 'crown',
      'starfish', 'fish', 'key', 'shell', 'pearl', 'seahorse', 'starfish', 'chest',
      'fish', 'shell', 'octopus', 'anchor', 'seahorse', 'starfish', 'fish', 'pearl',
    ],
    [
      'shell', 'seahorse', 'crown', 'fish', 'starfish', 'pearl', 'shell', 'seahorse',
      'key', 'fish', 'anchor', 'starfish', 'shell', 'chest', 'seahorse', 'fish',
      'starfish', 'crown', 'shell', 'pearl', 'seahorse', 'anchor', 'fish', 'starfish',
    ],
  ],
};
