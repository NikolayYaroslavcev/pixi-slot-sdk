/** Row of the line on each reel, left to right. Rows count from the top, from 0. */
export type Payline = readonly [number, number, number, number, number];

/**
 * The 15 fixed lines of the 5 × 4 field. Line numbers shown to the player are
 * the index here plus one.
 */
export const paylines: readonly Payline[] = [
  [0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1],
  [2, 2, 2, 2, 2],
  [3, 3, 3, 3, 3],
  [0, 1, 2, 1, 0],
  [3, 2, 1, 2, 3],
  [1, 2, 3, 2, 1],
  [2, 1, 0, 1, 2],
  [0, 1, 1, 1, 0],
  [3, 2, 2, 2, 3],
  [1, 0, 0, 0, 1],
  [2, 3, 3, 3, 2],
  [0, 1, 0, 1, 0],
  [3, 2, 3, 2, 3],
  [1, 2, 1, 2, 1],
];
