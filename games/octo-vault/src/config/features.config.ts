import type { Weighted } from 'slot-sdk';
import type { TentacleLook } from '../features/tentacleGrab/TentacleView';

export interface TentacleGrabSettings {
  /** How many tentacles one Octopus throws. */
  tentacles: readonly Weighted<number>[];
  /** The multiplier a tentacle gives the cell it grabs. */
  multipliers: readonly Weighted<number>[];
}

/**
 * The Grab: every Octopus that lands throws 2–4 tentacles, each turns a cell into a Wild
 * with ×2, ×3 or ×5. Weights are relative: 50 / 35 / 15 means half of the Octopuses throw two.
 */
export const tentacleGrabConfig: TentacleGrabSettings = {
  tentacles: [
    { value: 2, weight: 50 },
    { value: 3, weight: 35 },
    { value: 4, weight: 15 },
  ],
  multipliers: [
    { value: 2, weight: 60 },
    { value: 3, weight: 30 },
    { value: 5, weight: 10 },
  ],
};

/** A tentacle on screen: quick enough that four of them read as one gesture. */
export const tentacleLook: TentacleLook = {
  color: '#c86bff',
  width: 26,
  growMs: 260,
  bend: 0.18,
};
