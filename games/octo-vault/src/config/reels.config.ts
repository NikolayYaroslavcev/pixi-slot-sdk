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
    panelColor: '#1c0d06',
    motionBlur: { fromSpeed: 6, fullSpeed: maxSpeed, strength: 48, levels: 2 },
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
    color: '#ffd45a',
    outlineColor: '#2a1206',
    // Top right: the bottom of a Wild is its WILD ribbon, which the badge must not cover.
    offset: { x: 52, y: -54 },
  },
  // Every symbol once or twice, the Octopus only on reels 2 to 4 as the rules allow.
  initialSymbols: [
    ['jack', 'rum', 'queen', 'chest'],
    ['anchor', 'octopus', 'ace', 'king'],
    ['compass', 'map', 'jack', 'rum'],
    ['queen', 'chest', 'octopus', 'anchor'],
    ['ace', 'king', 'compass', 'map'],
  ],
  // Low symbols come more often than high ones. Each reel has 2 Chests and reels 2 to 4 one Octopus,
  // always at least 5 symbols apart, so a reel never shows two of them at once. Long strips keep
  // both rare: the Grab and free spins are features, not every spin. Composition and weights were
  // set with `npm run simulate`.
  // prettier-ignore
  strips: [
    [
      'ace', 'rum', 'queen', 'ace', 'jack', 'queen', 'anchor', 'map',
      'queen', 'queen', 'ace', 'jack', 'jack', 'ace', 'rum', 'anchor',
      'jack', 'king', 'king', 'rum', 'jack', 'king', 'jack', 'king',
      'jack', 'map', 'anchor', 'compass', 'rum', 'map', 'king', 'ace',
      'queen', 'queen', 'map', 'anchor', 'queen', 'rum', 'queen', 'rum',
      'ace', 'ace', 'jack', 'ace', 'anchor', 'jack', 'rum', 'king',
      'queen', 'ace', 'anchor', 'jack', 'ace', 'jack', 'anchor', 'king',
      'ace', 'king', 'jack', 'queen', 'king', 'jack', 'jack', 'map',
      'queen', 'king', 'queen', 'ace', 'king', 'rum', 'ace', 'king',
      'compass', 'queen', 'chest', 'compass', 'anchor', 'king', 'queen', 'king',
      'queen', 'jack', 'queen', 'compass', 'jack', 'jack', 'rum', 'jack',
      'ace', 'ace', 'king', 'king', 'map', 'queen', 'chest', 'ace',
      'queen',
    ],
    [
      'queen', 'ace', 'ace', 'jack', 'king', 'octopus', 'ace', 'jack',
      'king', 'king', 'map', 'ace', 'king', 'king', 'rum', 'anchor',
      'queen', 'queen', 'compass', 'jack', 'queen', 'anchor', 'map', 'rum',
      'jack', 'king', 'chest', 'queen', 'ace', 'jack', 'rum', 'jack',
      'anchor', 'jack', 'ace', 'map', 'queen', 'jack', 'queen', 'compass',
      'queen', 'map', 'queen', 'jack', 'ace', 'ace', 'map', 'jack',
      'compass', 'jack', 'rum', 'king', 'queen', 'jack', 'rum', 'anchor',
      'queen', 'king', 'king', 'ace', 'rum', 'jack', 'jack', 'king',
      'compass', 'ace', 'jack', 'queen', 'ace', 'king', 'queen', 'king',
      'ace', 'anchor', 'king', 'rum', 'anchor', 'jack', 'queen', 'chest',
      'queen', 'jack', 'ace', 'king', 'map', 'ace', 'king', 'queen',
      'anchor', 'queen', 'ace', 'anchor', 'jack', 'ace', 'king', 'rum',
      'queen', 'rum',
    ],
    [
      'compass', 'king', 'king', 'jack', 'jack', 'queen', 'queen', 'rum',
      'anchor', 'jack', 'ace', 'jack', 'queen', 'jack', 'queen', 'jack',
      'rum', 'anchor', 'ace', 'queen', 'ace', 'jack', 'king', 'compass',
      'map', 'anchor', 'queen', 'king', 'jack', 'queen', 'king', 'ace',
      'queen', 'jack', 'chest', 'ace', 'king', 'rum', 'ace', 'chest',
      'ace', 'jack', 'map', 'rum', 'jack', 'queen', 'map', 'king',
      'king', 'queen', 'queen', 'jack', 'king', 'queen', 'compass', 'ace',
      'anchor', 'king', 'jack', 'jack', 'king', 'queen', 'king', 'ace',
      'ace', 'octopus', 'queen', 'ace', 'rum', 'map', 'jack', 'jack',
      'jack', 'ace', 'queen', 'ace', 'king', 'map', 'ace', 'rum',
      'ace', 'jack', 'rum', 'rum', 'ace', 'anchor', 'king', 'king',
      'queen', 'anchor', 'anchor', 'compass', 'rum', 'queen', 'king', 'anchor',
      'map', 'queen',
    ],
    [
      'jack', 'queen', 'ace', 'jack', 'ace', 'compass', 'anchor', 'king',
      'anchor', 'king', 'king', 'chest', 'ace', 'map', 'jack', 'anchor',
      'jack', 'jack', 'anchor', 'ace', 'rum', 'jack', 'map', 'jack',
      'queen', 'rum', 'queen', 'ace', 'compass', 'king', 'queen', 'king',
      'anchor', 'ace', 'jack', 'ace', 'queen', 'queen', 'map', 'queen',
      'jack', 'queen', 'ace', 'jack', 'rum', 'queen', 'rum', 'ace',
      'king', 'king', 'chest', 'anchor', 'ace', 'queen', 'queen', 'compass',
      'anchor', 'king', 'queen', 'ace', 'rum', 'jack', 'ace', 'jack',
      'map', 'jack', 'king', 'ace', 'compass', 'ace', 'king', 'queen',
      'rum', 'queen', 'king', 'king', 'map', 'jack', 'rum', 'octopus',
      'queen', 'king', 'jack', 'queen', 'rum', 'jack', 'king', 'ace',
      'ace', 'jack', 'king', 'map', 'anchor', 'jack', 'rum', 'queen',
      'king', 'queen',
    ],
    [
      'ace', 'anchor', 'ace', 'queen', 'ace', 'anchor', 'queen', 'jack',
      'map', 'map', 'ace', 'queen', 'king', 'king', 'king', 'anchor',
      'rum', 'jack', 'ace', 'ace', 'map', 'anchor', 'rum', 'jack',
      'ace', 'king', 'queen', 'king', 'ace', 'ace', 'rum', 'king',
      'queen', 'king', 'king', 'ace', 'jack', 'anchor', 'jack', 'jack',
      'king', 'queen', 'ace', 'compass', 'anchor', 'ace', 'jack', 'ace',
      'queen', 'king', 'queen', 'jack', 'anchor', 'queen', 'queen', 'map',
      'jack', 'rum', 'anchor', 'king', 'rum', 'rum', 'map', 'jack',
      'rum', 'queen', 'queen', 'queen', 'rum', 'ace', 'ace', 'jack',
      'ace', 'king', 'map', 'king', 'compass', 'queen', 'rum', 'chest',
      'jack', 'king', 'compass', 'jack', 'jack', 'queen', 'jack', 'queen',
      'chest', 'jack', 'jack', 'king', 'king', 'queen', 'compass', 'queen',
      'jack',
    ],
  ],
};
