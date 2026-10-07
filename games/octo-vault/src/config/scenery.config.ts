import type { AmbientAirLook } from '../scene/AmbientAir';
import type { TitleLogoLook } from '../scene/TitleLogo';

/**
 * The air of the cove: sun shafts that sway slowly, dust and embers drifting up in them.
 * Few objects on purpose: the background lives without pulling the eye from the reels.
 */
export const ambientAirLook: AmbientAirLook = {
  rays: { alpha: 0.14, swayDegrees: 3, periodMs: 11_000 },
  dust: {
    count: 26,
    minSize: 4,
    maxSize: 10,
    minSpeed: 8,
    maxSpeed: 24,
    wobble: 22,
    alpha: 0.5,
    color: '#ffe2a8',
  },
  embers: {
    count: 12,
    minSize: 8,
    maxSize: 18,
    minSpeed: 30,
    maxSpeed: 80,
    wobble: 16,
    alpha: 0.75,
    color: '#ff9a3c',
  },
  // Free spins: the sunset deepens into a violet dusk.
  freeSpins: { color: '#3a0f5a', alpha: 0.32, fadeMs: 700 },
};

/**
 * The reel frame (`reel-frame.svg`): where its open window is in the texture, and how wide its
 * ornate border is. The frame is stretched so the window covers the field panel exactly; only
 * the middle of each side stretches, so the corners keep their shape.
 */
export const reelFrameLook = {
  // scripts/make-frame.mjs draws the texture at its shown size, so nothing stretches visibly.
  window: { x: 165, y: 165, width: 1590, height: 1287 },
  /** Untouched corner size of the texture, texture pixels. */
  corner: 260,
  thickness: 0.6,
};

/**
 * The logo's own life: a slow float, a glint over the gold every few seconds and stars that
 * flare on the compass and the lettering one after another. Quiet enough to stay out of the way.
 */
export const titleLogoLook: TitleLogoLook = {
  bob: { height: 8, periodMs: 4200 },
  breathe: { scale: 0.012 },
  shine: { everyMs: 5200, sweepMs: 1100, alpha: 0.6, width: 150 },
  sparkles: {
    points: [
      [0.5, 0.13],
      [0.17, 0.4],
      [0.86, 0.42],
      [0.72, 0.74],
    ],
    size: 70,
    periodMs: 4800,
  },
};
