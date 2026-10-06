import type { ColorSource } from 'pixi.js';
import type { LoadingScreenStyle } from '../assets/LoadingScreen';

/** Settings of a game that the SDK core needs. Money is in minor units (cents). */
export interface GameConfig {
  /** Balance at the start of the session, minor units. */
  initialBalance: number;
  /** Bet selected at the start of the session, minor units. Must be above zero. */
  initialBet: number;
  /** Canvas color behind all layers, also the loading screen background. */
  backgroundColor: ColorSource;
  loadingScreen: LoadingScreenStyle;
}
