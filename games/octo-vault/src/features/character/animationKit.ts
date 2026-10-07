import { easeInOutQuad, type Easing, type PartPose, type Pose } from 'slot-sdk';

const TAU = Math.PI * 2;

/**
 * A sine of `amp` around 0 with `cycles` whole periods in `durationMs`, so a looping animation
 * has no seam. `phase` (share of a period) lets parts sway out of step.
 */
export function wave(
  timeMs: number,
  durationMs: number,
  cycles: number,
  amp: number,
  phase = 0,
): number {
  return amp * Math.sin(TAU * ((cycles * timeMs) / durationMs + phase));
}

/** Hops: `height` at the top, 0 on the ground, `hops` of them in `durationMs`. */
export function hop(timeMs: number, durationMs: number, hops: number, height: number): number {
  return -height * Math.abs(Math.sin((Math.PI * hops * timeMs) / durationMs));
}

/** The value at `timeMs` between key poses `[time, value]`, eased between each two. */
export function keys(
  timeMs: number,
  poses: readonly (readonly [number, number])[],
  easing: Easing = easeInOutQuad,
): number {
  const after = poses.findIndex(([time]) => time > timeMs);
  if (after === -1) {
    return poses[poses.length - 1]?.[1] ?? 0;
  }
  const to = poses[after];
  const from = poses[after - 1];
  if (!from || !to) {
    return to?.[1] ?? 0;
  }
  const progress = (timeMs - from[0]) / (to[0] - from[0]);
  return from[1] + (to[1] - from[1]) * easing(progress);
}

/** Joins poses part by part; for the same value of the same part the later pose wins. */
export function merge<Part extends string>(...poses: Pose<Part>[]): Pose<Part> {
  const result: Pose<Part> = {};
  for (const pose of poses) {
    for (const [part, partPose] of Object.entries(pose) as [Part, PartPose][]) {
      const earlier: PartPose | undefined = result[part];
      result[part] = { ...earlier, ...partPose };
    }
  }
  return result;
}
