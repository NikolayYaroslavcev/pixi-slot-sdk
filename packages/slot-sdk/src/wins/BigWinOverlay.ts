import { Assets, Container, Sprite, Text, type Texture, type Ticker } from 'pixi.js';
import { easeOutBack, easeOutQuad } from '../anim/easing';
import { tween } from '../anim/tween';
import type { GameContext } from '../core/GameContext';
import type { BigWinScreen } from '../flow/winSteps';
import { createDim, placeOverlay } from '../ui/overlay';
import { WinCounter, winTextStyle } from '../ui/WinCounter';
import type { BigWinTier } from './bigWinTier';
import { WinParticles } from './WinParticles';
import type { WinStyle } from './WinStyle';

/** Share of the design width the title and the counter may take, so they never touch the edges. */
const maxContentWidth = 0.9;
/** The title and the counter grow from this size when the overlay appears. */
const popFromScale = 0.4;

/**
 * Big Win and its louder tiers: darkens the whole screen, shows the tier's title (its art, or its
 * text) and a counter growing to the win, and throws particles. Lives in the `winOverlay` layer,
 * under the HUD, so the Skip button stays in reach. It follows resizes and rotations every frame
 * it is shown.
 */
export class BigWinOverlay implements BigWinScreen {
  private readonly root = new Container({ label: 'bigWin', visible: false });
  private readonly dim: Sprite;
  private readonly content = new Container();
  private readonly titleText: Text;
  private readonly titleArt = new Sprite({ anchor: 0.5 });
  private readonly counter: WinCounter;
  private readonly particles: WinParticles;
  private readonly ticker: Ticker;
  private readonly layout: GameContext['layout'];
  private readonly style: WinStyle;
  /** Scale of the content while it pops in; the fit to the screen is applied on top of it. */
  private readonly pop = { scale: 1 };
  private tweens: { finish(): void }[] = [];

  constructor(context: Pick<GameContext, 'app' | 'layers' | 'layout' | 'config'>) {
    const { style } = context.config.wins;
    this.style = style;
    this.ticker = context.app.ticker;
    this.layout = context.layout;
    this.dim = createDim(style.overlayColor, style.overlayAlpha);
    const textStyle = { ...style, color: style.textColor };
    this.titleText = new Text({ anchor: 0.5, style: winTextStyle({ ...textStyle, fontSize: 1 }) });
    this.counter = new WinCounter(this.ticker, { ...textStyle, fontSize: style.bigWinCounterSize });
    this.counter.view.y = style.bigWinCounterSize * 0.75;
    this.particles = new WinParticles(context.app.renderer, style.particles);
    this.content.addChild(this.titleArt, this.titleText, this.counter.view);
    this.root.addChild(this.dim, this.particles.view, this.content);
    context.layers.winOverlay.addChild(this.root);
  }

  show(tier: BigWinTier, amount: number, fadeMs: number): void {
    this.hide();
    this.showTitle(tier);
    this.counter.countUp(amount, tier.countUpMs);
    this.particles.start(tier.particlesPerSecond);
    this.root.visible = true;
    this.root.alpha = 0;
    this.pop.scale = popFromScale;
    this.tweens = [
      tween(this.ticker, this.root, { alpha: 1 }, { duration: fadeMs, easing: easeOutQuad }),
      tween(this.ticker, this.pop, { scale: 1 }, { duration: fadeMs * 2, easing: easeOutBack }),
    ];
    this.place();
    this.ticker.add(this.update);
  }

  fadeOut(fadeMs: number): void {
    this.tweens.push(tween(this.ticker, this.root, { alpha: 0 }, { duration: fadeMs }));
  }

  hide(): void {
    for (const running of this.tweens) {
      running.finish();
    }
    this.tweens = [];
    this.counter.stop();
    this.particles.stop();
    this.ticker.remove(this.update);
    this.root.visible = false;
  }

  /** The tier's art if it has one, otherwise its title in its color. Either sits over the counter. */
  private showTitle(tier: BigWinTier): void {
    const art = tier.titleArt;
    this.titleArt.visible = art !== undefined;
    this.titleText.visible = art === undefined;
    if (art !== undefined) {
      this.titleArt.texture = Assets.get<Texture>(art);
      this.titleArt.scale.set(tier.titleScale);
      this.titleArt.y = -this.titleArt.height * 0.45;
      return;
    }
    const titleSize = this.style.bigWinTitleSize * tier.titleScale;
    this.titleText.text = tier.title;
    this.titleText.style = winTextStyle({ ...this.style, color: tier.color, fontSize: titleSize });
    this.titleText.y = -titleSize * 0.45;
  }

  private readonly update = (ticker: Ticker): void => {
    this.place();
    this.particles.update(ticker.deltaMS);
  };

  /** Covers the whole canvas with the dim and centers the content in the design area. */
  private place(): void {
    // Local bounds ignore the content's own scale, so this is its natural width.
    const width = this.content.getLocalBounds().width;
    placeOverlay(
      this.layout,
      { dim: this.dim, content: this.content },
      { width, maxWidthShare: maxContentWidth, scale: this.pop.scale },
    );
    const { x, y } = this.content.position;
    this.particles.view.position.set(x, y + this.style.bigWinCounterSize);
  }
}
