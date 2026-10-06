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
}
