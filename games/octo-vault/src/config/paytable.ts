import type { RegularSymbolId } from './symbols';

/** How many equal symbols in a row from the first reel pay. Fewer than 3 pay nothing. */
export type MatchCount = 3 | 4 | 5;

export const minimumMatch = 3;

/** A line of only Wilds pays as this symbol. */
export const wildPaysAs: RegularSymbolId = 'compass';

/**
 * Line pays in multiples of the total bet, by the number of matching symbols.
 * Lower symbols come more often on the reels, so they pay less.
 */
export const paytable: Readonly<Record<RegularSymbolId, Readonly<Record<MatchCount, number>>>> = {
  jack: { 3: 0.2, 4: 0.5, 5: 1.5 },
  queen: { 3: 0.2, 4: 0.5, 5: 1.5 },
  king: { 3: 0.3, 4: 0.8, 5: 2 },
  ace: { 3: 0.3, 4: 0.8, 5: 2 },
  rum: { 3: 0.5, 4: 1.5, 5: 4 },
  anchor: { 3: 0.8, 4: 2, 5: 6 },
  map: { 3: 1, 4: 3, 5: 8 },
  compass: { 3: 1.5, 4: 5, 5: 15 },
};
