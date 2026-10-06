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
    panelColor: '#071630',
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
    ['jack', 'bottle', 'queen', 'key'],
    ['anchor', 'octopus', 'ace', 'king'],
    ['shark', 'turtle', 'jack', 'bottle'],
    ['queen', 'key', 'octopus', 'anchor'],
    ['ace', 'king', 'shark', 'turtle'],
  ],
  // Low symbols come more often than high ones. Each reel has 2 Keys and reels 2–4 one Octopus,
  // always at least 5 symbols apart, so a reel never shows two of them at once. Long strips keep
  // both rare: the Grab and the Keys are features, not every spin. Composition and weights were
  // set with `npm run simulate` (see docs/decisions.md, stage 10.4).
  // prettier-ignore
  strips: [
    [
      'ace', 'bottle', 'queen', 'ace', 'jack', 'queen', 'anchor', 'turtle',
      'queen', 'queen', 'ace', 'jack', 'jack', 'ace', 'bottle', 'anchor',
      'jack', 'king', 'king', 'bottle', 'jack', 'king', 'jack', 'king',
      'jack', 'turtle', 'anchor', 'shark', 'bottle', 'turtle', 'king', 'ace',
      'queen', 'queen', 'turtle', 'anchor', 'queen', 'bottle', 'queen', 'bottle',
      'ace', 'ace', 'jack', 'ace', 'anchor', 'jack', 'bottle', 'king',
      'queen', 'ace', 'anchor', 'jack', 'ace', 'jack', 'anchor', 'king',
      'ace', 'king', 'jack', 'queen', 'king', 'jack', 'jack', 'turtle',
      'queen', 'king', 'queen', 'ace', 'king', 'bottle', 'ace', 'king',
      'shark', 'queen', 'key', 'shark', 'anchor', 'king', 'queen', 'king',
      'queen', 'jack', 'queen', 'shark', 'jack', 'jack', 'bottle', 'jack',
      'ace', 'ace', 'king', 'king', 'turtle', 'queen', 'key', 'ace',
      'queen',
    ],
    [
      'queen', 'ace', 'ace', 'jack', 'king', 'octopus', 'ace', 'jack',
      'king', 'king', 'turtle', 'ace', 'king', 'king', 'bottle', 'anchor',
      'queen', 'queen', 'shark', 'jack', 'queen', 'anchor', 'turtle', 'bottle',
      'jack', 'king', 'key', 'queen', 'ace', 'jack', 'bottle', 'jack',
      'anchor', 'jack', 'ace', 'turtle', 'queen', 'jack', 'queen', 'shark',
      'queen', 'turtle', 'queen', 'jack', 'ace', 'ace', 'turtle', 'jack',
      'shark', 'jack', 'bottle', 'king', 'queen', 'jack', 'bottle', 'anchor',
      'queen', 'king', 'king', 'ace', 'bottle', 'jack', 'jack', 'king',
      'shark', 'ace', 'jack', 'queen', 'ace', 'king', 'queen', 'king',
      'ace', 'anchor', 'king', 'bottle', 'anchor', 'jack', 'queen', 'key',
      'queen', 'jack', 'ace', 'king', 'turtle', 'ace', 'king', 'queen',
      'anchor', 'queen', 'ace', 'anchor', 'jack', 'ace', 'king', 'bottle',
      'queen', 'bottle',
    ],
    [
      'shark', 'king', 'king', 'jack', 'jack', 'queen', 'queen', 'bottle',
      'anchor', 'jack', 'ace', 'jack', 'queen', 'jack', 'queen', 'jack',
      'bottle', 'anchor', 'ace', 'queen', 'ace', 'jack', 'king', 'shark',
      'turtle', 'anchor', 'queen', 'king', 'jack', 'queen', 'king', 'ace',
      'queen', 'jack', 'key', 'ace', 'king', 'bottle', 'ace', 'key',
      'ace', 'jack', 'turtle', 'bottle', 'jack', 'queen', 'turtle', 'king',
      'king', 'queen', 'queen', 'jack', 'king', 'queen', 'shark', 'ace',
      'anchor', 'king', 'jack', 'jack', 'king', 'queen', 'king', 'ace',
      'ace', 'octopus', 'queen', 'ace', 'bottle', 'turtle', 'jack', 'jack',
      'jack', 'ace', 'queen', 'ace', 'king', 'turtle', 'ace', 'bottle',
      'ace', 'jack', 'bottle', 'bottle', 'ace', 'anchor', 'king', 'king',
      'queen', 'anchor', 'anchor', 'shark', 'bottle', 'queen', 'king', 'anchor',
      'turtle', 'queen',
    ],
    [
      'jack', 'queen', 'ace', 'jack', 'ace', 'shark', 'anchor', 'king',
      'anchor', 'king', 'king', 'key', 'ace', 'turtle', 'jack', 'anchor',
      'jack', 'jack', 'anchor', 'ace', 'bottle', 'jack', 'turtle', 'jack',
      'queen', 'bottle', 'queen', 'ace', 'shark', 'king', 'queen', 'king',
      'anchor', 'ace', 'jack', 'ace', 'queen', 'queen', 'turtle', 'queen',
      'jack', 'queen', 'ace', 'jack', 'bottle', 'queen', 'bottle', 'ace',
      'king', 'king', 'key', 'anchor', 'ace', 'queen', 'queen', 'shark',
      'anchor', 'king', 'queen', 'ace', 'bottle', 'jack', 'ace', 'jack',
      'turtle', 'jack', 'king', 'ace', 'shark', 'ace', 'king', 'queen',
      'bottle', 'queen', 'king', 'king', 'turtle', 'jack', 'bottle', 'octopus',
      'queen', 'king', 'jack', 'queen', 'bottle', 'jack', 'king', 'ace',
      'ace', 'jack', 'king', 'turtle', 'anchor', 'jack', 'bottle', 'queen',
      'king', 'queen',
    ],
    [
      'ace', 'anchor', 'ace', 'queen', 'ace', 'anchor', 'queen', 'jack',
      'turtle', 'turtle', 'ace', 'queen', 'king', 'king', 'king', 'anchor',
      'bottle', 'jack', 'ace', 'ace', 'turtle', 'anchor', 'bottle', 'jack',
      'ace', 'king', 'queen', 'king', 'ace', 'ace', 'bottle', 'king',
      'queen', 'king', 'king', 'ace', 'jack', 'anchor', 'jack', 'jack',
      'king', 'queen', 'ace', 'shark', 'anchor', 'ace', 'jack', 'ace',
      'queen', 'king', 'queen', 'jack', 'anchor', 'queen', 'queen', 'turtle',
      'jack', 'bottle', 'anchor', 'king', 'bottle', 'bottle', 'turtle', 'jack',
      'bottle', 'queen', 'queen', 'queen', 'bottle', 'ace', 'ace', 'jack',
      'ace', 'king', 'turtle', 'king', 'shark', 'queen', 'bottle', 'key',
      'jack', 'king', 'shark', 'jack', 'jack', 'queen', 'jack', 'queen',
      'key', 'jack', 'jack', 'king', 'king', 'queen', 'shark', 'queen',
      'jack',
    ],
  ],
};
