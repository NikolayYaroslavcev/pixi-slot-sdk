import type {
  HighlightStyle,
  ReelGridSize,
  ReelGridViewOptions,
  ReelMotionSettings,
} from 'slot-sdk';
import type { MultiplierBadgeStyle } from '../scene/MultiplierBadges';
import type { SymbolGrid, SymbolId } from './symbols';

interface ReelsConfig {
  size: ReelGridSize;
  /** Sizes in design coordinates. `layout.ts` places and scales the whole field. */
  view: ReelGridViewOptions;
  motion: ReelMotionSettings;
  /** How winning symbols stand out while wins are shown. */
  highlight: HighlightStyle;
  /** The multiplier of a Wild, in the corner of its cell. */
  multiplierBadge: MultiplierBadgeStyle;
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
    panelColor: '#05151a',
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
  multiplierBadge: {
    fontFamily: 'Lilita One',
    fontSize: 54,
    color: '#ffd23f',
    outlineColor: '#062033',
    offset: { x: 48, y: 52 },
  },
  // Every symbol once or twice, the Octopus only on reels 2–4 as the rules allow.
  initialSymbols: [
    ['shell', 'pearl', 'starfish', 'key'],
    ['anchor', 'octopus', 'fish', 'seahorse'],
    ['crown', 'chest', 'shell', 'pearl'],
    ['starfish', 'key', 'octopus', 'anchor'],
    ['fish', 'seahorse', 'crown', 'chest'],
  ],
  // Low symbols come more often than high ones. Each reel has 2 Keys and reels 2–4 one Octopus,
  // always at least 5 symbols apart, so a reel never shows two of them at once. Long strips keep
  // both rare: the Grab and the Keys are features, not every spin. Composition and weights were
  // set with `npm run simulate` (see docs/decisions.md, stage 10.4).
  // prettier-ignore
  strips: [
    [
      'fish', 'pearl', 'starfish', 'fish', 'shell', 'starfish', 'anchor', 'chest',
      'starfish', 'starfish', 'fish', 'shell', 'shell', 'fish', 'pearl', 'anchor',
      'shell', 'seahorse', 'seahorse', 'pearl', 'shell', 'seahorse', 'shell', 'seahorse',
      'shell', 'chest', 'anchor', 'crown', 'pearl', 'chest', 'seahorse', 'fish',
      'starfish', 'starfish', 'chest', 'anchor', 'starfish', 'pearl', 'starfish', 'pearl',
      'fish', 'fish', 'shell', 'fish', 'anchor', 'shell', 'pearl', 'seahorse',
      'starfish', 'fish', 'anchor', 'shell', 'fish', 'shell', 'anchor', 'seahorse',
      'fish', 'seahorse', 'shell', 'starfish', 'seahorse', 'shell', 'shell', 'chest',
      'starfish', 'seahorse', 'starfish', 'fish', 'seahorse', 'pearl', 'fish', 'seahorse',
      'crown', 'starfish', 'key', 'crown', 'anchor', 'seahorse', 'starfish', 'seahorse',
      'starfish', 'shell', 'starfish', 'crown', 'shell', 'shell', 'pearl', 'shell',
      'fish', 'fish', 'seahorse', 'seahorse', 'chest', 'starfish', 'key', 'fish',
      'starfish',
    ],
    [
      'starfish', 'fish', 'fish', 'shell', 'seahorse', 'octopus', 'fish', 'shell',
      'seahorse', 'seahorse', 'chest', 'fish', 'seahorse', 'seahorse', 'pearl', 'anchor',
      'starfish', 'starfish', 'crown', 'shell', 'starfish', 'anchor', 'chest', 'pearl',
      'shell', 'seahorse', 'key', 'starfish', 'fish', 'shell', 'pearl', 'shell',
      'anchor', 'shell', 'fish', 'chest', 'starfish', 'shell', 'starfish', 'crown',
      'starfish', 'chest', 'starfish', 'shell', 'fish', 'fish', 'chest', 'shell',
      'crown', 'shell', 'pearl', 'seahorse', 'starfish', 'shell', 'pearl', 'anchor',
      'starfish', 'seahorse', 'seahorse', 'fish', 'pearl', 'shell', 'shell', 'seahorse',
      'crown', 'fish', 'shell', 'starfish', 'fish', 'seahorse', 'starfish', 'seahorse',
      'fish', 'anchor', 'seahorse', 'pearl', 'anchor', 'shell', 'starfish', 'key',
      'starfish', 'shell', 'fish', 'seahorse', 'chest', 'fish', 'seahorse', 'starfish',
      'anchor', 'starfish', 'fish', 'anchor', 'shell', 'fish', 'seahorse', 'pearl',
      'starfish', 'pearl',
    ],
    [
      'crown', 'seahorse', 'seahorse', 'shell', 'shell', 'starfish', 'starfish', 'pearl',
      'anchor', 'shell', 'fish', 'shell', 'starfish', 'shell', 'starfish', 'shell',
      'pearl', 'anchor', 'fish', 'starfish', 'fish', 'shell', 'seahorse', 'crown',
      'chest', 'anchor', 'starfish', 'seahorse', 'shell', 'starfish', 'seahorse', 'fish',
      'starfish', 'shell', 'key', 'fish', 'seahorse', 'pearl', 'fish', 'key',
      'fish', 'shell', 'chest', 'pearl', 'shell', 'starfish', 'chest', 'seahorse',
      'seahorse', 'starfish', 'starfish', 'shell', 'seahorse', 'starfish', 'crown', 'fish',
      'anchor', 'seahorse', 'shell', 'shell', 'seahorse', 'starfish', 'seahorse', 'fish',
      'fish', 'octopus', 'starfish', 'fish', 'pearl', 'chest', 'shell', 'shell',
      'shell', 'fish', 'starfish', 'fish', 'seahorse', 'chest', 'fish', 'pearl',
      'fish', 'shell', 'pearl', 'pearl', 'fish', 'anchor', 'seahorse', 'seahorse',
      'starfish', 'anchor', 'anchor', 'crown', 'pearl', 'starfish', 'seahorse', 'anchor',
      'chest', 'starfish',
    ],
    [
      'shell', 'starfish', 'fish', 'shell', 'fish', 'crown', 'anchor', 'seahorse',
      'anchor', 'seahorse', 'seahorse', 'key', 'fish', 'chest', 'shell', 'anchor',
      'shell', 'shell', 'anchor', 'fish', 'pearl', 'shell', 'chest', 'shell',
      'starfish', 'pearl', 'starfish', 'fish', 'crown', 'seahorse', 'starfish', 'seahorse',
      'anchor', 'fish', 'shell', 'fish', 'starfish', 'starfish', 'chest', 'starfish',
      'shell', 'starfish', 'fish', 'shell', 'pearl', 'starfish', 'pearl', 'fish',
      'seahorse', 'seahorse', 'key', 'anchor', 'fish', 'starfish', 'starfish', 'crown',
      'anchor', 'seahorse', 'starfish', 'fish', 'pearl', 'shell', 'fish', 'shell',
      'chest', 'shell', 'seahorse', 'fish', 'crown', 'fish', 'seahorse', 'starfish',
      'pearl', 'starfish', 'seahorse', 'seahorse', 'chest', 'shell', 'pearl', 'octopus',
      'starfish', 'seahorse', 'shell', 'starfish', 'pearl', 'shell', 'seahorse', 'fish',
      'fish', 'shell', 'seahorse', 'chest', 'anchor', 'shell', 'pearl', 'starfish',
      'seahorse', 'starfish',
    ],
    [
      'fish', 'anchor', 'fish', 'starfish', 'fish', 'anchor', 'starfish', 'shell',
      'chest', 'chest', 'fish', 'starfish', 'seahorse', 'seahorse', 'seahorse', 'anchor',
      'pearl', 'shell', 'fish', 'fish', 'chest', 'anchor', 'pearl', 'shell',
      'fish', 'seahorse', 'starfish', 'seahorse', 'fish', 'fish', 'pearl', 'seahorse',
      'starfish', 'seahorse', 'seahorse', 'fish', 'shell', 'anchor', 'shell', 'shell',
      'seahorse', 'starfish', 'fish', 'crown', 'anchor', 'fish', 'shell', 'fish',
      'starfish', 'seahorse', 'starfish', 'shell', 'anchor', 'starfish', 'starfish', 'chest',
      'shell', 'pearl', 'anchor', 'seahorse', 'pearl', 'pearl', 'chest', 'shell',
      'pearl', 'starfish', 'starfish', 'starfish', 'pearl', 'fish', 'fish', 'shell',
      'fish', 'seahorse', 'chest', 'seahorse', 'crown', 'starfish', 'pearl', 'key',
      'shell', 'seahorse', 'crown', 'shell', 'shell', 'starfish', 'shell', 'starfish',
      'key', 'shell', 'shell', 'seahorse', 'seahorse', 'starfish', 'crown', 'starfish',
      'shell',
    ],
  ],
};
