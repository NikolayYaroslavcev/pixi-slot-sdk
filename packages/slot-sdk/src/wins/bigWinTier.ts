/**
 * A level of large win with its own overlay, e.g. Big Win and Mega Win.
 * A game lists its tiers in `GameConfig.wins.bigWins`; a higher tier has a higher `minBets`.
 */
export interface BigWinTier {
  /** Names the tier, e.g. "BIG WIN": shown on the overlay unless there is `titleArt`, and sent with `bigWinShown`. */
  title: string;
  /** Alias of a texture from the manifest shown in place of the title text, e.g. a lettered plaque. */
  titleArt?: string;
  /** The round's total win reaches the tier at this many bets or more. */
  minBets: number;
  /** The counter grows from zero to the win in this time. */
  countUpMs: number;
  /** The final amount stays on screen this long after the count. */
  holdMs: number;
  color: string;
  /**
   * Size of the title text relative to `WinStyle.bigWinTitleSize`, or the scale of `titleArt`:
   * a higher tier looks louder.
   */
  titleScale: number;
  /** Particles thrown per second while the overlay is shown. */
  particlesPerSecond: number;
}

/**
 * The highest tier `amount` reaches for this `bet`, or undefined for a win below every tier.
 * Both amounts are in minor units. Tiers may come in any order.
 */
export function bigWinTier(
  amount: number,
  bet: number,
  tiers: readonly BigWinTier[],
): BigWinTier | undefined {
  let reached: BigWinTier | undefined;
  for (const tier of tiers) {
    if (amount >= tier.minBets * bet && (!reached || tier.minBets > reached.minBets)) {
      reached = tier;
    }
  }
  return reached;
}
