import type { ReelMotionData } from './reelMotion';

/**
 * A reel is an endless column of slots numbered by integers. Slot `k` stands at row
 * `k + position`: as `position` grows, every symbol moves down and lower numbers come
 * in from above. At a whole position `p`, the visible rows show slots `-p` to `-p + rowCount - 1`.
 */

/** Wraps any whole number into 0..length-1, also negative ones: -1 becomes length - 1. */
export function wrapIndex(index: number, length: number): number {
  return ((index % length) + length) % length;
}

export function stripSymbol(strip: readonly string[], slot: number): string {
  const symbolId = strip[wrapIndex(slot, strip.length)];
  if (symbolId === undefined) {
    throw new Error('Reel strip is empty');
  }
  return symbolId;
}

/**
 * The slot a pooled sprite shows. A reel has `poolSize` sprites (rows + 2) for the window
 * of slots from one above the visible rows down to one below them. Sprite `i` always shows
 * the slot of that window whose number gives remainder `i`: when a slot leaves the window
 * at the bottom, the slot that enters at the top has the same remainder and takes its sprite.
 */
export function poolSlot(poolIndex: number, position: number, poolSize: number): number {
  const firstSlot = -Math.floor(position) - 1;
  return firstSlot + wrapIndex(poolIndex - firstSlot, poolSize);
}

/** The rows of the field on one reel, read from `ReelGrid`. */
export interface FieldColumn {
  readonly rowCount: number;
  symbolAt(rowIndex: number): string;
}

/**
 * Symbol in a slot. Three sources, from the most to the least specific:
 * - the rows where the reel last stopped show the field;
 * - the planned landing slots show the target symbols;
 * - every other slot shows the strip.
 */
export function slotSymbol(
  slot: number,
  motion: Pick<ReelMotionData, 'restSlot' | 'plan' | 'target'>,
  strip: readonly string[],
  field: FieldColumn,
): string {
  const restRow = slot - motion.restSlot;
  if (restRow >= 0 && restRow < field.rowCount) {
    return field.symbolAt(restRow);
  }
  if (motion.plan && motion.target) {
    const landing = motion.target[slot - motion.plan.landingSlot];
    if (landing !== undefined) {
      return landing;
    }
  }
  return stripSymbol(strip, slot);
}
