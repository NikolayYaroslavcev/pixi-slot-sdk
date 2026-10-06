import type { ColorSource } from 'pixi.js';

/** Settings of a game that the SDK core needs. Money is in minor units (cents). */
export interface GameConfig {
  /** Balance at the start of the session, minor units. */
  initialBalance: number;
  /** Bet selected at the start of the session, minor units. Must be above zero. */
  initialBet: number;
  /** Canvas color behind all layers. */
  backgroundColor: ColorSource;
}
