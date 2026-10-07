/**
 * Reels that keep spinning in suspense: once `needed` symbols that pass `counts` have landed,
 * every reel after the one that completed them. Empty when they never complete, or complete
 * only on the last reel. Columns are read in landing order, left to right.
 */
export function anticipatedReels<SymbolId extends string>(
  columns: readonly (readonly SymbolId[])[],
  counts: (symbolId: SymbolId) => boolean,
  needed: number,
): number[] {
  let found = 0;
  for (let reelIndex = 0; reelIndex < columns.length; reelIndex += 1) {
    found += (columns[reelIndex] ?? []).filter(counts).length;
    if (found >= needed) {
      return range(reelIndex + 1, columns.length);
    }
  }
  return [];
}

function range(from: number, to: number): number[] {
  return Array.from({ length: Math.max(to - from, 0) }, (_, index) => from + index);
}
