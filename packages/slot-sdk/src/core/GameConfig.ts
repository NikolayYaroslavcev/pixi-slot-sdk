import type { ColorSource } from 'pixi.js';
import type { LoadingScreenStyle } from '../assets/LoadingScreen';
import type { PresentationTiming } from '../flow/winSteps';
import type { HudStyle } from '../ui/Hud';

/** Settings of a game that the SDK core needs. Money is in minor units (cents). */
export interface GameConfig {
  /** Balance at the start of the session, minor units. */
  initialBalance: number;
  /** Bet selected at the start of the session, minor units. Must be one of `betLevels`. */
  initialBet: number;
  /** Bets the player can choose from with − and +, ascending, minor units. */
  betLevels: readonly number[];
  /** Canvas color behind all layers, also the loading screen background. */
  backgroundColor: ColorSource;
  loadingScreen: LoadingScreenStyle;
  /** How long the SDK win steps stay on screen. */
  presentation: PresentationTiming;
  hud: HudStyle;
}
