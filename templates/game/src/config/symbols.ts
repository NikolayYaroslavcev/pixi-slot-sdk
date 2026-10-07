/**
 * Every symbol of the game. A new symbol needs a look in `assets.ts` and a place on the strips
 * in `reels.config.ts`; the compiler points at both.
 */
export type SymbolId = 'cherry' | 'lemon' | 'bell' | 'seven';

/** One array per reel from the top, as the reels show them. */
export type SymbolGrid = readonly (readonly SymbolId[])[];

/** Three of a symbol on the middle row pay this many bets. */
export const paytable: Readonly<Record<SymbolId, number>> = {
  cherry: 2,
  lemon: 3,
  bell: 5,
  seven: 10,
};
