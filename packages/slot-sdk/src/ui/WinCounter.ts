import { BitmapText, type ColorSource, type TextStyleOptions, type Ticker } from 'pixi.js';
import { easeOutCubic } from '../anim/easing';
import { tween, type Tween } from '../anim/tween';
import { formatMoney } from '../math/money';
import { counterFont } from './counterFont';

export interface WinCounterStyle {
  fontFamily: string;
  fontSize: number;
  color: ColorSource;
  outlineColor: ColorSource;
}

/**
 * An amount of money that grows to its final value instead of jumping to it.
 * Centered on its origin. Drawn with a bitmap font, so counting costs no text rendering per frame.
 * A plain class, like the rest of the HUD.
 */
export class WinCounter {
  readonly view: BitmapText;
  private shown = 0;
  private counting: Tween<WinCounter> | null = null;

  constructor(
    private readonly ticker: Ticker,
    style: WinCounterStyle,
  ) {
    this.view = new BitmapText({
      text: formatMoney(0),
      anchor: 0.5,
      style: { fontFamily: counterFont(winTextStyle(style)), fontSize: style.fontSize },
    });
  }

  /** Minor units on screen now. Fractional while counting; the text shows whole minor units. */
  get value(): number {
    return this.shown;
  }

  set value(amount: number) {
    this.shown = amount;
    const text = formatMoney(Math.round(amount));
    if (this.view.text !== text) {
      this.view.text = text;
    }
  }

  /** Counts from zero to `amount` in `durationMs`, slowing down near the end. */
  countUp(amount: number, durationMs: number): void {
    this.stop();
    this.value = 0;
    this.counting = tween<WinCounter>(
      this.ticker,
      this,
      { value: amount },
      {
        duration: durationMs,
        easing: easeOutCubic,
      },
    );
  }

  show(amount: number): void {
    this.stop();
    this.value = amount;
  }

  /** Jumps to the final amount of a running count and leaves the ticker. */
  stop(): void {
    this.counting?.finish();
    this.counting = null;
  }
}

/** Text style of win amounts. The outline grows with the font, so every size reads the same. */
export function winTextStyle(style: WinCounterStyle): TextStyleOptions {
  return {
    fill: style.color,
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    stroke: { color: style.outlineColor, width: Math.round(style.fontSize / 8), join: 'round' },
  };
}
