import type { RoundState } from '../flow/RoundFlow';
import type { Win } from '../math/round';

/**
 * Events of the SDK core and their payloads. `GameContext.events` carries this map.
 *
 * A game adds its own events by augmenting this interface in any of its files:
 *
 * ```ts
 * declare module 'slot-sdk' {
 *   interface GameEvents {
 *     introFinished: { durationMs: number };
 *   }
 * }
 * ```
 */
export interface GameEvents {
  /** New balance in minor units. */
  balanceChanged: number;
  /** New bet in minor units. */
  betChanged: number;
  /** New last win in minor units. */
  lastWinChanged: number;
  /** The reels have started spinning: a paid spin, or the next free spin of a script. */
  spinStarted: undefined;
  /**
   * The reels know where they will stop: `columns` from the top, one per reel. No reel brakes
   * before the listeners return, so they may still hold reels back with `delayStop`.
   */
  reelsLanding: { columns: readonly (readonly string[])[] };
  /** A reel has come to rest on its target symbols, which are already in `ReelGrid`. */
  reelStopped: { reelIndex: number };
  /** The last reel of the spin has come to rest. */
  spinCompleted: undefined;
  /** The round moved to another state: what the player may do has changed. */
  roundStateChanged: RoundState;
  /** The round could not be played or finished. The flow is already back in `idle`. */
  roundFailed: { betReturned: boolean };
  /** A `wins` step started: these combinations are on screen now. */
  winsShown: { wins: readonly Win[]; amount: number };
  /** A Big Win level is on screen: `tierIndex` in `GameConfig.wins.bigWins`, 0 is the lowest. */
  bigWinShown: { tierIndex: number; title: string };
  /** The Big Win overlay is gone, played to the end or skipped. */
  bigWinEnded: undefined;
  /** The player pressed a button of the HUD or of a popup. For a click sound. */
  buttonPressed: undefined;
}
