import type { ColorSource } from 'pixi.js';
import type { LoadingScreenStyle } from '../assets/LoadingScreen';
import type { WinTiming } from '../flow/winSteps';
import type { HudStyle } from '../ui/Hud';
import type { BigWinTier } from '../wins/bigWinTier';
import type { WinStyle } from '../wins/WinStyle';

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
  /** How wins are shown. */
  wins: WinPresentationConfig;
  hud: HudStyle;
}

export interface WinPresentationConfig {
  timing: WinTiming;
  /** Big Win levels by the round's total win in bets, e.g. Big Win and Mega Win. Empty: none. */
  bigWins: readonly BigWinTier[];
  style: WinStyle;
}
