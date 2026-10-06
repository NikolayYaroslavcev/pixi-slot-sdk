import { Container, Sprite, Text, Texture, type ColorSource, type Ticker } from 'pixi.js';
import { easeOutBack, tween, type GameContext, type Tween } from 'slot-sdk';

/** Look of the free spins intro and summary. Sizes are design pixels. */
export interface FreeSpinsBannerLook {
  fontFamily: string;
  titleColor: ColorSource;
  valueColor: ColorSource;
  outlineColor: ColorSource;
  titleSize: number;
  valueSize: number;
  dimColor: ColorSource;
  dimAlpha: number;
  popMs: number;
}

/** Share of the design width the texts may take, so they never touch the edges. */
const maxContentWidth = 0.9;

/**
 * The full-screen card between the base game and free spins: "FREE SPINS / 8" before the series,
 * "FREE SPINS WIN / 45.00" after it. Lives in the `winOverlay` layer, under the HUD, so Skip stays
 * in reach. It follows resizes and rotations every frame it is shown.
 */
export class FreeSpinsBanner {
  private readonly root = new Container({ label: 'freeSpinsBanner', visible: false });
  private readonly dim = new Sprite(Texture.WHITE);
  private readonly content = new Container();
  private readonly title: Text;
  private readonly value: Text;
  private readonly pop = { scale: 1 };
  private popping: Tween<{ scale: number }> | null = null;
  private readonly ticker: Ticker;
  private readonly layout: GameContext['layout'];

  constructor(
    context: Pick<GameContext, 'app' | 'layers' | 'layout'>,
    private readonly look: FreeSpinsBannerLook,
  ) {
    this.ticker = context.app.ticker;
    this.layout = context.layout;
    this.dim.tint = look.dimColor;
    this.dim.alpha = look.dimAlpha;
    const text = (fill: ColorSource, fontSize: number): Text =>
      new Text({
        anchor: 0.5,
        style: {
          fill,
          fontSize,
          fontFamily: look.fontFamily,
          stroke: { color: look.outlineColor, width: fontSize / 8, join: 'round' },
        },
      });
    this.title = text(look.titleColor, look.titleSize);
    this.title.y = -look.titleSize * 0.6;
    this.value = text(look.valueColor, look.valueSize);
    this.value.y = look.valueSize * 0.45;
    this.content.addChild(this.title, this.value);
    this.root.addChild(this.dim, this.content);
    context.layers.winOverlay.addChild(this.root);
  }

  show(title: string, value: string): void {
    this.title.text = title;
    this.value.text = value;
    this.pop.scale = 0.5;
    this.popping = tween(
      this.ticker,
      this.pop,
      { scale: 1 },
      { duration: this.look.popMs, easing: easeOutBack },
    );
    this.root.visible = true;
    this.place();
    this.ticker.add(this.place);
  }

  hide(): void {
    this.popping?.finish();
    this.popping = null;
    this.ticker.remove(this.place);
    this.root.visible = false;
  }

  /** Covers the whole canvas with the dim and centers the texts in the design area. */
  private readonly place = (): void => {
    const area = this.layout.visibleArea;
    const variant = this.layout.variant;
    if (!area || !variant) {
      return;
    }
    this.dim.position.set(area.x, area.y);
    this.dim.setSize(area.width, area.height);
    this.content.position.set(variant.width / 2, variant.height / 2);
    const naturalWidth = this.content.getLocalBounds().width;
    const fit = Math.min(1, (variant.width * maxContentWidth) / naturalWidth);
    this.content.scale.set(fit * this.pop.scale);
  };
}
