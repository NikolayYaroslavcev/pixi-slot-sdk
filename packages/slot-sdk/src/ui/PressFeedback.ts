import type { Container, Ticker } from 'pixi.js';

const hoverScale = 1.05;
const pressedScale = 0.92;
/** How quickly the size follows the pointer: about two thirds of the way in this many ms. */
const settleMs = 45;

/**
 * How a button answers the pointer, the same in every game: it grows a little under the pointer
 * and shrinks while pressed. Scales `content`, never the view the layout owns, with a short ease
 * on the ticker that leaves it once the size has settled.
 */
export class PressFeedback {
  private hovered = false;
  private pressed = false;
  private animating = false;

  constructor(
    view: Container,
    private readonly content: Container,
    private readonly ticker: Ticker,
  ) {
    view.on('pointerover', () => {
      this.set(true, this.pressed);
    });
    view.on('pointerout', () => {
      this.set(false, false);
    });
    view.on('pointerdown', () => {
      this.set(this.hovered, true);
    });
    view.on('pointerup', () => {
      this.set(this.hovered, false);
    });
    view.on('pointerupoutside', () => {
      this.set(false, false);
    });
  }

  /** Back to rest, e.g. when the button is disabled under the pointer. */
  reset(): void {
    this.set(false, false);
  }

  private set(hovered: boolean, pressed: boolean): void {
    this.hovered = hovered;
    this.pressed = pressed;
    if (this.animating || this.content.scale.x === this.targetScale) {
      return;
    }
    this.animating = true;
    this.ticker.add(this.animate);
  }

  private get targetScale(): number {
    if (this.pressed) {
      return pressedScale;
    }
    return this.hovered ? hoverScale : 1;
  }

  private readonly animate = (ticker: Ticker): void => {
    const target = this.targetScale;
    const current = this.content.scale.x;
    const step = 1 - Math.exp(-ticker.deltaMS / settleMs);
    const next = Math.abs(target - current) < 0.002 ? target : current + (target - current) * step;
    this.content.scale.set(next);
    if (next === target) {
      this.animating = false;
      this.ticker.remove(this.animate);
    }
  };
}
