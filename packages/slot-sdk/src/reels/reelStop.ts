/** Where a reel comes to rest and what it shows there. Computed once, when the reel starts to stop. */
export interface ReelStopPlan {
  /** A whole number of symbols: at rest every row stands exactly in its cell. */
  stopPosition: number;
  /** Position where braking begins, so that braking covers exactly the planned distance. */
  brakeFrom: number;
  /** Slot of the top row at rest. The target symbols take this slot and the ones below it. */
  landingSlot: number;
}

/**
 * Plans the stop of a reel that is at `position` now.
 *
 * The target symbols are not searched for in the strip: they are put into the slots that
 * will be in view at the stop. So any target works, even one the strip does not contain.
 * The reel stops at the nearest whole position that leaves room for braking and keeps
 * the landing slots out of view until they scroll in from above. Nothing is swapped
 * on screen: the reel simply drives to the planned position.
 *
 * `brakingDistance` is how far the reel moves from the start of braking to the stop.
 */
export function planStop(
  position: number,
  rowCount: number,
  brakingDistance: number,
): ReelStopPlan {
  // Slot `k` stands at row `k + position`. The bottom landing slot is `rowCount - 1 - stopPosition`,
  // and it is out of view while its row is -1 or above, so stopPosition >= position + rowCount.
  const stopPosition = Math.ceil(position + Math.max(brakingDistance, rowCount));
  return {
    stopPosition,
    brakeFrom: stopPosition - brakingDistance,
    landingSlot: -stopPosition,
  };
}
