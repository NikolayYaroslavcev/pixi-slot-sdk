/**
 * A level of large win with its own overlay, e.g. Big Win and Mega Win.
 * A game lists its tiers in `GameConfig.wins.bigWins`; a higher tier has a higher `minBets`.
 */
export interface BigWinTier {
  /** Shown on the overlay, e.g. "BIG WIN". */
  title: string;
  /** The round's total win reaches the tier at this many bets or more. */
  minBets: number;
  /** The counter grows from zero to the win in this time. */
  countUpMs: number;
  /** The final amount stays on screen this long after the count. */
  holdMs: number;
  /** Color of the title. */
  color: string;
  /** Size of the title relative to `WinStyle.bigWinTitleSize`: a higher tier looks louder. */
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
