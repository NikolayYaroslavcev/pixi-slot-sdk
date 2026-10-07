import { easeOutQuad, type CharacterAnimation, type Pose } from 'slot-sdk';
import type { OctopusPart } from '../../config/character.config';
import { hop, keys, merge, wave } from './animationKit';

/**
 * Animations of the octopus captain. Offsets are body pixels, turns radians. Loops repeat whole
 * periods, so they have no seam. The captain stays beside the reels: motion is small next to
 * them, and only the Big Win lets him go wild.
 */
type Animation = CharacterAnimation<OctopusPart>;
type Eyes = 'open' | 'angry' | 'closed';

/**
 * Tentacles and the side they spread to. A clockwise turn lifts the tip of a tentacle that
 * points left and lowers one that points right, so `side` makes "lift" mean the same for both.
 */
const tentacles = [
  ['tentacle_1', 1],
  ['tentacle_7', 1],
  ['tentacle_2', 1],
  ['tentacle_8', 1],
  ['tentacle_3', -1],
  ['tentacle_5', -1],
  ['tentacle_4', -1],
  ['tentacle_6', -1],
] as const;

/**
 * One expression over the face painted on the body: its sly grin and open eyes, unless covered
 * by angry or closed eyes and the wide grin.
 */
function face(eyes: Eyes, grin: boolean): Pose<OctopusPart> {
  const closed = { alpha: eyes === 'closed' ? 1 : 0 };
  return {
    eyes_angry: { alpha: eyes === 'angry' ? 1 : 0 },
    eye_closed_left: closed,
    eye_closed_right: closed,
    mouth_grin: { alpha: grin ? 1 : 0 },
  };
}

/** Every tentacle sways on its own phase; `lift` raises the tips by that turn. */
function sway(swing: (phase: number) => number, lift = 0): Pose<OctopusPart> {
  const pose: Pose<OctopusPart> = {};
  tentacles.forEach(([part, side], index) => {
    pose[part] = { rotation: side * lift + swing(index * 0.17) };
  });
  return pose;
}

const idle: Animation = {
  durationMs: 3200,
  pose(t) {
    const d = this.durationMs;
    const blinking = t > 2800 && t < 2930;
    return merge(
      {
        body: {
          y: wave(t, d, 1, 3),
          scaleX: 1 + wave(t, d, 1, 0.01, 0.25),
          scaleY: 1 + wave(t, d, 1, 0.018),
        },
        hat: { rotation: wave(t, d, 1, 0.025, 0.3) },
      },
      sway((phase) => wave(t, d, 1, 0.045, phase)),
      face(blinking ? 'closed' : 'open', false),
    );
  },
};

const spin: Animation = {
  durationMs: 1000,
  pose(t) {
    const d = this.durationMs;
    return merge(
      {
        body: {
          y: hop(t, d, 2, 6),
          scaleY: 1 + wave(t, d, 2, 0.02, 0.25),
          rotation: wave(t, d, 1, 0.02),
        },
        hat: { rotation: wave(t, d, 2, 0.035) },
      },
      sway((phase) => wave(t, d, 2, 0.08, phase)),
      face('open', false),
    );
  },
};

/** Tense: crouched, leaning toward the reels, tentacles drawn in and trembling, gold aglow. */
const anticipation: Animation = {
  durationMs: 1200,
  pose(t) {
    const d = this.durationMs;
    return merge(
      {
        body: {
          x: wave(t, d, 12, 1),
          rotation: 0.04 + wave(t, d, 6, 0.005),
          scaleX: 1.04,
          scaleY: 0.95,
        },
        hat: { rotation: -0.04 },
        glow_gold: { alpha: 0.55 + wave(t, d, 2, 0.2), scaleX: 1 + wave(t, d, 2, 0.05) },
        sparkles: { alpha: 0.3 + wave(t, d, 3, 0.2) },
      },
      { glow_gold: { scaleY: 1 + wave(t, d, 2, 0.05) } },
      sway((phase) => wave(t, d, 8, 0.02, phase), -0.12),
      face('angry', true),
    );
  },
};

/** The body half of the Grab: a lean toward the reels; `CaptainArms` draws the reaching tentacle. */
const grab: Animation = {
  durationMs: 700,
  pose(t) {
    const lean = (value: number): number =>
      keys(t, [
        [0, 0],
        [180, value],
        [520, value],
        [700, 0],
      ]);
    return merge(
      {
        body: { rotation: lean(0.06), x: lean(6) },
        hat: { rotation: lean(-0.06) },
      },
      sway((phase) => wave(t, this.durationMs, 1, 0.04, phase)),
      face('angry', true),
    );
  },
};

/** Key poses of the win: `[time in ms, value]`. */
const winTracks = {
  cheer: [
    [0, 0],
    [450, 0.3],
    [1100, 0.2],
    [1400, 0],
  ],
  hop: [
    [0, 0],
    [150, 4],
    [450, -22],
    [750, 0],
    [850, 3],
    [1000, 0],
  ],
  squash: [
    [0, 1],
    [150, 0.93],
    [400, 1.05],
    [750, 1],
    [850, 0.96],
    [1000, 1],
  ],
  hat: [
    [0, 0],
    [450, -10],
    [750, 0],
  ],
  sparkle: [
    [0, 0],
    [300, 1],
    [1000, 1],
    [1400, 0],
  ],
  sparkleSize: [
    [0, 0.85],
    [1400, 1.1],
  ],
} as const satisfies Record<string, readonly (readonly [number, number])[]>;

/** A happy hop with the tentacles thrown up, eyes squeezed shut, sparkles around. */
const win: Animation = {
  durationMs: 1400,
  pose(t) {
    const d = this.durationMs;
    const size = keys(t, winTracks.sparkleSize, easeOutQuad);
    return merge(
      {
        body: { y: keys(t, winTracks.hop), scaleY: keys(t, winTracks.squash) },
        hat: { y: keys(t, winTracks.hat) },
        sparkles: { alpha: keys(t, winTracks.sparkle), scaleX: size, scaleY: size },
      },
      sway((phase) => wave(t, d, 2, 0.06, phase), keys(t, winTracks.cheer)),
      face(t > 120 && t < 1200 ? 'closed' : 'open', t > 80 && t < 1250),
    );
  },
};

/** Jumping for joy over the open treasure chest, coins flying, tentacles wide, all aglow. */
const bigWin: Animation = {
  durationMs: 1600,
  pose(t) {
    const d = this.durationMs;
    const rise = t / d;
    // Seen only mid-flight: they fade in and out, so the jump back to the start is invisible.
    const later = (rise + 0.5) % 1;
    return merge(
      {
        body: { y: hop(t, d, 2, 26), scaleY: 1 + wave(t, d, 2, 0.04, 0.25) },
        hat: { y: hop(t, d, 2, 10), rotation: wave(t, d, 2, 0.06) },
        glow_gold: { alpha: 0.85 + wave(t, d, 2, 0.15), scaleX: 1.15 + wave(t, d, 2, 0.06) },
        sparkles: { alpha: 0.8 + wave(t, d, 4, 0.2), rotation: wave(t, d, 1, 0.06) },
        chest: { alpha: 1, scaleY: 1 + wave(t, d, 2, 0.03) },
        coins: { alpha: Math.sin(Math.PI * later), y: -later * 140 },
        coin_trail: { alpha: Math.sin(Math.PI * rise), y: -rise * 60 },
      },
      { glow_gold: { scaleY: 1.15 + wave(t, d, 2, 0.06) } },
      sway((phase) => wave(t, d, 2, 0.1, phase), 0.3),
      face('closed', true),
    );
  },
};

/** Every animation of the captain by name. `characterConfig.animations` maps the game's moments to them. */
export const octopusAnimations: Readonly<Record<string, Animation>> = {
  idle,
  spin,
  anticipation,
  grab,
  win,
  bigwin: bigWin,
};
