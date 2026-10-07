import {
  Assets,
  Container,
  Sprite,
  Text,
  type ColorSource,
  type Texture,
  type Ticker,
} from 'pixi.js';
import {
  createDim,
  easeOutBack,
  placeOverlay,
  tween,
  type GameContext,
  type Tween,
} from 'slot-sdk';

/** Look of the free spins intro and summary. Sizes are design pixels. */
export interface FreeSpinsBannerLook {
  /** Scale of the lettered plaque (`wins/free-spins*.svg`). */
  titleScale: number;
  fontFamily: string;
  valueColor: ColorSource;
  outlineColor: ColorSource;
  valueSize: number;
  dimColor: ColorSource;
  dimAlpha: number;
  popMs: number;
}

/** Share of the design width the card may take, so it never touches the edges. */
const maxContentWidth = 0.9;

/**
 * The full-screen card between the base game and free spins: the FREE SPINS plaque over the
 * number of spins before the series, the TOTAL WIN plaque over the series win after it. Lives in
 * the `winOverlay` layer, under the HUD, so Skip stays in reach. It follows resizes and rotations
 * every frame it is shown.
 */
export class FreeSpinsBanner {
  private readonly root = new Container({ label: 'freeSpinsBanner', visible: false });
  private readonly dim;
  private readonly content = new Container();
  private readonly title = new Sprite({ anchor: 0.5 });
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
    this.dim = createDim(look.dimColor, look.dimAlpha);
    this.value = new Text({
      anchor: 0.5,
      style: {
        fill: look.valueColor,
        fontSize: look.valueSize,
        fontFamily: look.fontFamily,
        stroke: { color: look.outlineColor, width: look.valueSize / 8, join: 'round' },
      },
    });
    this.content.addChild(this.title, this.value);
    this.root.addChild(this.dim, this.content);
    context.layers.winOverlay.addChild(this.root);
  }

  /** Shows the plaque with the texture alias `art` and `value` under it. */
  show(art: string, value: string): void {
    this.title.texture = Assets.get<Texture>(art);
    this.title.scale.set(this.look.titleScale);
    this.title.y = -this.title.height * 0.4;
    this.value.text = value;
    this.value.y = this.title.height * 0.1 + this.look.valueSize * 0.45;
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

  private readonly place = (): void => {
    placeOverlay(
      this.layout,
      { dim: this.dim, content: this.content },
      {
        width: this.content.getLocalBounds().width,
        maxWidthShare: maxContentWidth,
        scale: this.pop.scale,
      },
    );
  };
}
