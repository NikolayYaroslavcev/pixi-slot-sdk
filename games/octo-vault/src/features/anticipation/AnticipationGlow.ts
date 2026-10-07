import { Graphics, type ColorSource, type Ticker } from 'pixi.js';
import type { ReelGridView } from 'slot-sdk';

/** The light around a reel in suspense. Sizes are design pixels of the field. */
export interface AnticipationGlowLook {
  color: ColorSource;
  /** Width of the rim around the reel. */
  width: number;
  /** Strength of the light inside the reel at the top of a pulse, from 0 to 1. */
  fillAlpha: number;
  pulseMs: number;
}

/**
 * A pulsing gold column over one reel of the field. A child of the field, so the layout moves
 * and scales it with the symbols. Runs on the ticker only while it is shown.
 */
export class AnticipationGlow {
  private readonly view = new Graphics({ visible: false, blendMode: 'add' });
  private timeMs = 0;

  constructor(
    private readonly field: ReelGridView,
    private readonly ticker: Ticker,
    private readonly look: AnticipationGlowLook,
    reelSize: { width: number; height: number },
  ) {
    const { width, height } = reelSize;
    const rect = (): Graphics =>
      this.view.roundRect(-width / 2, -height / 2, width, height, look.width);
    rect().fill({ color: look.color, alpha: look.fillAlpha });
    // A wide soft halo, then a narrower one, then the bright rim: light, not a drawn line.
    rect().stroke({ color: look.color, width: look.width * 4, alpha: 0.18 });
    rect().stroke({ color: look.color, width: look.width * 2, alpha: 0.35 });
    rect().stroke({ color: '#fff6c8', width: look.width * 0.6 });
    field.container.addChild(this.view);
  }

  show(reelIndex: number): void {
    const top = this.field.cellCenter({ reelIndex, rowIndex: 0 });
    const bounds = this.field.container.boundsArea;
    this.view.position.set(top.x, bounds.height / 2);
    if (!this.view.visible) {
      this.view.visible = true;
      this.timeMs = 0;
      this.ticker.add(this.pulse);
    }
  }

  hide(): void {
    this.view.visible = false;
    this.ticker.remove(this.pulse);
  }

  private readonly pulse = (ticker: Ticker): void => {
    this.timeMs += ticker.deltaMS;
    this.view.alpha = 0.75 + 0.25 * Math.sin((this.timeMs / this.look.pulseMs) * Math.PI * 2);
  };
}
