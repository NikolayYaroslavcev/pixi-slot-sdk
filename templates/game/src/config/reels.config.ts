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
  /** What the field shows before the first spin. */
  initialSymbols: SymbolGrid;
  /** The symbols each reel shows while it spins, top to bottom; the last is followed by the first. */
  strips: readonly (readonly SymbolId[])[];
}

const maxSpeed = 24;

export const reelsConfig: ReelsConfig = {
  size: { reelCount: 3, rowCount: 3 },
  view: {
    cellWidth: 200,
    cellHeight: 200,
    gap: 12,
    padding: 24,
    panelColor: '#1d2130',
    motionBlur: { fromSpeed: 6, fullSpeed: maxSpeed, strength: 48, levels: 2 },
  },
  motion: {
    startSpeed: 4,
    maxSpeed,
    accelerateMs: 220,
    minimumSpinMs: 600,
    decelerateMs: 320,
    bounce: 0.12,
    bounceMs: 160,
    startDelayMs: 60,
    stopDelayMs: 200,
    quickStopDelayMs: 60,
  },
  highlight: { dimBrightness: 0.35, fadeMs: 220, pulseScale: 0.1, pulseMs: 900 },
  initialSymbols: [
    ['cherry', 'lemon', 'bell'],
    ['seven', 'cherry', 'lemon'],
    ['bell', 'seven', 'cherry'],
  ],
  // Placeholder math, not balanced: cheap symbols come often, so wins show up while you build.
  strips: [
    ['cherry', 'lemon', 'cherry', 'bell', 'cherry', 'lemon', 'seven', 'cherry'],
    ['lemon', 'cherry', 'bell', 'cherry', 'seven', 'cherry', 'lemon', 'cherry'],
    ['cherry', 'seven', 'lemon', 'cherry', 'bell', 'cherry', 'lemon', 'cherry'],
  ],
};
