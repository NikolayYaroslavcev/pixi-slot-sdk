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
    ['jack', 'bottle', 'queen', 'key'],
    ['anchor', 'octopus', 'ace', 'king'],
    ['skull', 'wheel', 'jack', 'bottle'],
    ['queen', 'key', 'octopus', 'anchor'],
    ['ace', 'king', 'skull', 'wheel'],
  ],
  // Low symbols come more often than high ones. Each reel has 2 Keys and reels 2–4 one Octopus,
  // always at least 5 symbols apart, so a reel never shows two of them at once. Long strips keep
  // both rare: the Grab and the Keys are features, not every spin. Composition and weights were
  // set with `npm run simulate` (see docs/decisions.md, stage 10.4).
  // prettier-ignore
  strips: [
    [
      'ace', 'bottle', 'queen', 'ace', 'jack', 'queen', 'anchor', 'wheel',
      'queen', 'queen', 'ace', 'jack', 'jack', 'ace', 'bottle', 'anchor',
      'jack', 'king', 'king', 'bottle', 'jack', 'king', 'jack', 'king',
      'jack', 'wheel', 'anchor', 'skull', 'bottle', 'wheel', 'king', 'ace',
      'queen', 'queen', 'wheel', 'anchor', 'queen', 'bottle', 'queen', 'bottle',
      'ace', 'ace', 'jack', 'ace', 'anchor', 'jack', 'bottle', 'king',
      'queen', 'ace', 'anchor', 'jack', 'ace', 'jack', 'anchor', 'king',
      'ace', 'king', 'jack', 'queen', 'king', 'jack', 'jack', 'wheel',
      'queen', 'king', 'queen', 'ace', 'king', 'bottle', 'ace', 'king',
      'skull', 'queen', 'key', 'skull', 'anchor', 'king', 'queen', 'king',
      'queen', 'jack', 'queen', 'skull', 'jack', 'jack', 'bottle', 'jack',
      'ace', 'ace', 'king', 'king', 'wheel', 'queen', 'key', 'ace',
      'queen',
    ],
    [
      'queen', 'ace', 'ace', 'jack', 'king', 'octopus', 'ace', 'jack',
      'king', 'king', 'wheel', 'ace', 'king', 'king', 'bottle', 'anchor',
      'queen', 'queen', 'skull', 'jack', 'queen', 'anchor', 'wheel', 'bottle',
      'jack', 'king', 'key', 'queen', 'ace', 'jack', 'bottle', 'jack',
      'anchor', 'jack', 'ace', 'wheel', 'queen', 'jack', 'queen', 'skull',
      'queen', 'wheel', 'queen', 'jack', 'ace', 'ace', 'wheel', 'jack',
      'skull', 'jack', 'bottle', 'king', 'queen', 'jack', 'bottle', 'anchor',
      'queen', 'king', 'king', 'ace', 'bottle', 'jack', 'jack', 'king',
      'skull', 'ace', 'jack', 'queen', 'ace', 'king', 'queen', 'king',
      'ace', 'anchor', 'king', 'bottle', 'anchor', 'jack', 'queen', 'key',
      'queen', 'jack', 'ace', 'king', 'wheel', 'ace', 'king', 'queen',
      'anchor', 'queen', 'ace', 'anchor', 'jack', 'ace', 'king', 'bottle',
      'queen', 'bottle',
    ],
    [
      'skull', 'king', 'king', 'jack', 'jack', 'queen', 'queen', 'bottle',
      'anchor', 'jack', 'ace', 'jack', 'queen', 'jack', 'queen', 'jack',
      'bottle', 'anchor', 'ace', 'queen', 'ace', 'jack', 'king', 'skull',
      'wheel', 'anchor', 'queen', 'king', 'jack', 'queen', 'king', 'ace',
      'queen', 'jack', 'key', 'ace', 'king', 'bottle', 'ace', 'key',
      'ace', 'jack', 'wheel', 'bottle', 'jack', 'queen', 'wheel', 'king',
      'king', 'queen', 'queen', 'jack', 'king', 'queen', 'skull', 'ace',
      'anchor', 'king', 'jack', 'jack', 'king', 'queen', 'king', 'ace',
      'ace', 'octopus', 'queen', 'ace', 'bottle', 'wheel', 'jack', 'jack',
      'jack', 'ace', 'queen', 'ace', 'king', 'wheel', 'ace', 'bottle',
      'ace', 'jack', 'bottle', 'bottle', 'ace', 'anchor', 'king', 'king',
      'queen', 'anchor', 'anchor', 'skull', 'bottle', 'queen', 'king', 'anchor',
      'wheel', 'queen',
    ],
    [
      'jack', 'queen', 'ace', 'jack', 'ace', 'skull', 'anchor', 'king',
      'anchor', 'king', 'king', 'key', 'ace', 'wheel', 'jack', 'anchor',
      'jack', 'jack', 'anchor', 'ace', 'bottle', 'jack', 'wheel', 'jack',
      'queen', 'bottle', 'queen', 'ace', 'skull', 'king', 'queen', 'king',
      'anchor', 'ace', 'jack', 'ace', 'queen', 'queen', 'wheel', 'queen',
      'jack', 'queen', 'ace', 'jack', 'bottle', 'queen', 'bottle', 'ace',
      'king', 'king', 'key', 'anchor', 'ace', 'queen', 'queen', 'skull',
      'anchor', 'king', 'queen', 'ace', 'bottle', 'jack', 'ace', 'jack',
      'wheel', 'jack', 'king', 'ace', 'skull', 'ace', 'king', 'queen',
      'bottle', 'queen', 'king', 'king', 'wheel', 'jack', 'bottle', 'octopus',
      'queen', 'king', 'jack', 'queen', 'bottle', 'jack', 'king', 'ace',
      'ace', 'jack', 'king', 'wheel', 'anchor', 'jack', 'bottle', 'queen',
      'king', 'queen',
    ],
    [
      'ace', 'anchor', 'ace', 'queen', 'ace', 'anchor', 'queen', 'jack',
      'wheel', 'wheel', 'ace', 'queen', 'king', 'king', 'king', 'anchor',
      'bottle', 'jack', 'ace', 'ace', 'wheel', 'anchor', 'bottle', 'jack',
      'ace', 'king', 'queen', 'king', 'ace', 'ace', 'bottle', 'king',
      'queen', 'king', 'king', 'ace', 'jack', 'anchor', 'jack', 'jack',
      'king', 'queen', 'ace', 'skull', 'anchor', 'ace', 'jack', 'ace',
      'queen', 'king', 'queen', 'jack', 'anchor', 'queen', 'queen', 'wheel',
      'jack', 'bottle', 'anchor', 'king', 'bottle', 'bottle', 'wheel', 'jack',
      'bottle', 'queen', 'queen', 'queen', 'bottle', 'ace', 'ace', 'jack',
      'ace', 'king', 'wheel', 'king', 'skull', 'queen', 'bottle', 'key',
      'jack', 'king', 'skull', 'jack', 'jack', 'queen', 'jack', 'queen',
      'key', 'jack', 'jack', 'king', 'king', 'queen', 'skull', 'queen',
      'jack',
    ],
  ],
};
