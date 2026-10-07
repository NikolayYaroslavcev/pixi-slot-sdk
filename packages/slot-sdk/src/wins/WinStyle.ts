import type { ColorSource } from 'pixi.js';
import type { ParticleStyle } from './WinParticles';

/** Look of the win presentation, set by the game. Sizes are design pixels. */
export interface WinStyle {
  fontFamily: string;
  /** Lines of the wins on screen take these colors in turn. */
  lineColors: readonly ColorSource[];
  lineWidth: number;
  /** Color of the amounts on the field and of the Big Win counter. */
  textColor: ColorSource;
  /** Outline of every win text, so it reads over any symbol. */
  outlineColor: ColorSource;
  /** The counter of all wins together, in the middle of the field. */
  counterFontSize: number;
  /** The amount of a single win, next to its line. */
  amountFontSize: number;
  /** Color the Big Win overlay darkens the screen with, and how strongly, from 0 to 1. */
  overlayColor: ColorSource;
  overlayAlpha: number;
  /** Title of a tier with `titleScale` 1. */
  bigWinTitleSize: number;
  bigWinCounterSize: number;
  /** The fountain of particles behind a Big Win. */
  particles: ParticleStyle;
}
