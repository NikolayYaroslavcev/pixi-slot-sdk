import type { AmbientSeaLook } from '../scene/AmbientSea';

/**
 * The water around the reels: light that sways slowly, a handful of bubbles and specks.
 * Few objects on purpose: the background lives without pulling the eye from the reels.
 */
export const ambientSeaLook: AmbientSeaLook = {
  rays: { alpha: 0.32, swayDegrees: 3, periodMs: 11_000 },
  bubbles: { count: 14, minSize: 10, maxSize: 34, minSpeed: 50, maxSpeed: 130, wobble: 14 },
  plankton: {
    count: 24,
    minSize: 3,
    maxSize: 7,
    minSpeed: 8,
    maxSpeed: 22,
    wobble: 20,
    alpha: 0.45,
    color: '#bfeaff',
  },
  // Free spins: the deep turns violet, the keeper's colour.
  freeSpins: { color: '#2a0b5a', alpha: 0.38, fadeMs: 700 },
};

/**
 * Where `reel-frame.svg` sits around the reel panel, design pixels of the field: its border
 * is 40 wide, and above it is room for the crest and the tentacles.
 */
export const reelFrameOffset = { x: -40, y: -110 };
