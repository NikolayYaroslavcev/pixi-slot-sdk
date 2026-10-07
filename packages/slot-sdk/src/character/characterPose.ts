/**
 * How one part of a character differs from its rest pose at a moment of an animation.
 * Every value is optional: what an animation leaves out stays as at rest.
 */
export interface PartPose {
  /** Offset from the rest position, in the parent's units. */
  x?: number;
  y?: number;
  /** Radians added to the rest rotation. */
  rotation?: number;
  /** Multiplies the rest scale. */
  scaleX?: number;
  scaleY?: number;
  /** Replaces the rest alpha, e.g. 1 to show an expression that is hidden at rest. */
  alpha?: number;
}

/** A pose of the whole character: the parts an animation moves, by part name. */
export type Pose<Part extends string = string> = Partial<Record<Part, PartPose>>;

/**
 * A named animation of a layered character: the pose at any moment of one pass.
 * Pure, so a test can check a pose without a renderer.
 *
 * ```ts
 * const wave: CharacterAnimation<'arm'> = {
 *   durationMs: 1000,
 *   pose: (timeMs) => ({ arm: { rotation: Math.sin((timeMs / 1000) * Math.PI * 2) * 0.3 } }),
 * };
 * ```
 */
export interface CharacterAnimation<Part extends string = string> {
  /** Length of one pass. A looping animation repeats it, so its pose at the end should match the start. */
  readonly durationMs: number;
  /** The pose `timeMs` into the pass, from 0 to `durationMs`. */
  pose(timeMs: number): Pose<Part>;
}

/** Where a part is: its rest pose, or the result of posing it. */
export interface PartTransform {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  alpha: number;
}

/**
 * The transform of a part posed by several animations at once, as during a crossfade: each pose
 * counts with its weight, and weights add up to 1. A pose that leaves the part out counts as rest.
 */
export function posePart(
  rest: Readonly<PartTransform>,
  poses: readonly { pose: PartPose | undefined; weight: number }[],
): PartTransform {
  const result = { x: rest.x, y: rest.y, rotation: rest.rotation, scaleX: 0, scaleY: 0, alpha: 0 };
  let weights = 0;
  for (const { pose = {}, weight } of poses) {
    weights += weight;
    result.x += (pose.x ?? 0) * weight;
    result.y += (pose.y ?? 0) * weight;
    result.rotation += (pose.rotation ?? 0) * weight;
    result.scaleX += (pose.scaleX ?? 1) * weight;
    result.scaleY += (pose.scaleY ?? 1) * weight;
    result.alpha += (pose.alpha ?? rest.alpha) * weight;
  }
  // Nothing plays: the rest pose.
  if (weights === 0) {
    return { ...rest };
  }
  result.scaleX *= rest.scaleX;
  result.scaleY *= rest.scaleY;
  return result;
}
