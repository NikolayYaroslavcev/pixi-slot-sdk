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
    color: '#9ffcf0',
  },
  // Free spins: the deep turns violet, the keeper's colour.
  freeSpins: { color: '#2a0b4a', alpha: 0.4, fadeMs: 700 },
};

/** The frame drawn around the reel panel, design pixels of the field. Matches `reel-frame.svg`. */
export const reelFrameBorder = 40;
