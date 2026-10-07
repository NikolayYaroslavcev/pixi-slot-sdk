import type { CharacterLayer } from 'slot-sdk';
import type { CharacterMoment } from '../features/character/CharacterDirector';

/**
 * The octopus captain is built from the v3 layers (art/pirate-octopus-animation/),
 * cleaned of sheet frames and captions by scripts/clean-captain.mjs into public/assets/captain/.
 * Each layer is its own picture: `pivot` is a point of that picture (the base of a tentacle,
 * where the hat sits) and `position` is where that point goes on the body, in body pixels.
 * Parts are listed back to front; tentacle bases hide under the coat. The face is painted on
 * the body (a sly grin); the other expressions cover it and start hidden (`alpha: 0`).
 */
const deg = (degrees: number): number => (degrees * Math.PI) / 180;
const at = (x: number, y: number): { x: number; y: number } => ({ x, y });

/** A tentacle behind the body: its base under the coat, turned and sized to spread around. */
const tentacle = (
  pivot: { x: number; y: number },
  position: { x: number; y: number },
  turn: number,
  scale: number,
  options: { mirror?: boolean } = {},
) =>
  ({
    parent: 'body',
    behind: true,
    pivot,
    position,
    rotation: deg(turn),
    scale,
    ...options,
  }) as const;

const layers = {
  glow_gold: { pivot: at(53, 76), position: at(122, 150), scale: 3, alpha: 0, blendMode: 'add' },
  body: { pivot: at(122, 250) },
  // Behind the body, back to front: two tentacles rising behind the head, the others spreading
  // from under the coat, the coat and the shadow the head casts on it. The body's art fades out
  // at the bottom, so the head sits in the coat.
  tentacle_1: tentacle(at(25, 165), at(62, 212), -40, 0.8),
  tentacle_3: tentacle(at(165, 160), at(182, 205), 15, 0.8, { mirror: true }),
  tentacle_7: tentacle(at(8, 115), at(70, 232), -8, 0.85, { mirror: true }),
  tentacle_5: tentacle(at(25, 168), at(172, 238), 30, 0.8),
  tentacle_2: tentacle(at(35, 160), at(80, 262), -45, 0.8),
  tentacle_4: tentacle(at(149, 168), at(168, 262), 45, 0.8, { mirror: true }),
  tentacle_8: tentacle(at(8, 125), at(70, 268), 8, 0.95, { mirror: true }),
  tentacle_6: tentacle(at(15, 160), at(175, 270), -6, 0.95),
  coat: { parent: 'body', behind: true, pivot: at(127, 12), position: at(124, 128) },
  shadow: { parent: 'body', behind: true, pivot: at(85, 35), position: at(125, 185) },
  compass: { parent: 'body', pivot: at(45, 8), position: at(200, 228), scale: 0.32 },
  earring: { parent: 'body', pivot: at(30, 10), position: at(223, 108), scale: 0.33 },
  mouth_grin: { parent: 'body', pivot: at(54, 38), position: at(138, 145), scale: 0.95, alpha: 0 },
  eyes_angry: { parent: 'body', pivot: at(61, 42), position: at(143, 98), scale: 1.22, alpha: 0 },
  // One closed eye, mirrored for the other: the face is turned, so the right eye is smaller.
  eye_closed_left: {
    parent: 'body',
    pivot: at(29, 32),
    position: at(112, 100),
    scale: 1.25,
    alpha: 0,
  },
  eye_closed_right: {
    parent: 'body',
    pivot: at(29, 32),
    position: at(181, 104),
    scale: 1.05,
    mirror: true,
    alpha: 0,
  },
  hat: {
    parent: 'body',
    pivot: at(130, 120),
    position: at(125, 38),
    rotation: deg(-6),
    scale: 0.78,
  },
  // Big Win: the treasure at the captain's feet, coins and sparks flying.
  chest: { pivot: at(91, 150), position: at(122, 318), scale: 0.62, alpha: 0 },
  coins: { pivot: at(67, 68), position: at(122, 250), scale: 0.7, alpha: 0 },
  coin_trail: { pivot: at(73, 74), position: at(215, 150), scale: 0.9, alpha: 0, blendMode: 'add' },
  sparkles: { pivot: at(173, 80), position: at(122, 140), scale: 1.05, alpha: 0, blendMode: 'add' },
} as const satisfies Record<string, Omit<CharacterLayer, 'texture'>>;

export type OctopusPart = keyof typeof layers;

/** Picture of each part; both closed eyes share one. */
const textureOf: Record<OctopusPart, string> = {
  ...(Object.fromEntries(Object.keys(layers).map((part) => [part, part])) as Record<
    OctopusPart,
    string
  >),
  eye_closed_left: 'eye_closed',
  eye_closed_right: 'eye_closed',
};

/** Alias of a captain picture in the asset manifest. */
export const captainAlias = (picture: string): string => `captain.${picture}`;

/** Every picture the captain needs, for the asset manifest. */
export const captainPictures: readonly string[] = [...new Set(Object.values(textureOf))];

export const characterConfig = {
  layers: Object.fromEntries(
    Object.entries(layers).map(([part, layer]) => [
      part,
      { ...layer, texture: captainAlias(textureOf[part as OctopusPart]) },
    ]),
  ) as Record<OctopusPart, CharacterLayer<OctopusPart>>,
  /** The point the layout places: between the lowest tentacles, in body pixels. */
  origin: at(122, 300),
  /** Crossfade between animations. */
  mixMs: 220,
  /**
   * Which animation plays at each moment of the game: the presentation mapping of this game.
   * The SDK plays names; the moments and their meaning stay here.
   */
  animations: {
    idle: 'idle',
    spin: 'spin',
    anticipation: 'anticipation',
    grab: 'grab',
    win: 'win',
    bigWin: 'bigwin',
  } satisfies Record<CharacterMoment, string>,
};

/**
 * The Grab, acted by the captain: a tentacle grows from under his coat to each grabbed cell,
 * coils around it and pulls back, while the tentacle it grows from tucks away. These are the
 * tentacles on the side of the reels, used in turn; `from` is where each leaves the coat, in
 * body pixels. Widths are body pixels too; colors follow the v3 tentacles.
 */
export const captainArmLook = {
  tentacles: [
    { part: 'tentacle_5', from: at(200, 222) },
    { part: 'tentacle_6', from: at(205, 262) },
    { part: 'tentacle_4', from: at(196, 246) },
    { part: 'tentacle_3', from: at(196, 196) },
  ],
  reachMs: 340,
  curlMs: 150,
  holdMs: 240,
  retractMs: 380,
  /** Pulling back early, when the wins come on screen. */
  pullBackMs: 160,
  rootWidth: 56,
  tipWidth: 15,
  outline: 3,
  /** How far the tentacle bows sideways, as a share of its length. */
  bend: 0.18,
  /** Radius of the coil around the grabbed cell, as a share of the cell width. */
  coil: 0.4,
  colors: {
    skin: '#e0252d',
    shade: '#8e0d1d',
    outline: '#4a0610',
    shine: '#ff9f8a',
    sucker: '#f7c443',
    suckerRim: '#8a4f0c',
    suckerHollow: '#c97a12',
  },
} as const satisfies {
  tentacles: readonly { part: OctopusPart; from: { x: number; y: number } }[];
} & Record<string, unknown>;

export type CaptainArmLook = typeof captainArmLook;
