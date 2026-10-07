import {
  Assets,
  Container,
  Graphics,
  Sprite,
  Text,
  type Application,
  type ColorSource,
  type Texture,
} from 'pixi.js';
import { easeOutQuad } from '../anim/easing';
import { tween } from '../anim/tween';

/** Look of the SDK loading screen: the game's logo over a progress bar. */
export interface LoadingScreenStyle {
  /** Alias of a texture from the `preload` bundle, shown above the progress bar. */
  logo: string;
  barColor: ColorSource;
  textColor: ColorSource;
}

const BAR_WIDTH = 320;
const BAR_HEIGHT = 12;
// The logo takes most of a phone's width, and stops growing on a wide screen.
const LOGO_MAX_WIDTH = 640;
const LOGO_SCREEN_SHARE = 0.85;
// Room above and below the logo and bar on a short landscape screen.
const LOGO_SCREEN_HEIGHT_SHARE = 0.6;
const GAP = 32;
const BUTTON_WIDTH = 160;
const BUTTON_HEIGHT = 56;
const FADE_OUT_MS = 400;
const ERROR_MESSAGE = "Couldn't load the game.\nCheck your connection.";

/**
 * Covers the screen while assets load: logo, progress bar and, after a failure, an error with Retry.
 * The ticker is not running during loading, so the screen renders itself after every change.
 * `hide()` fades it out once the game runs.
 */
export class LoadingScreen {
  readonly view = new Container({ label: 'loadingScreen' });
  private readonly background = new Graphics();
  private readonly content = new Container();
  private readonly bar = new Graphics();
  private readonly message: Text;
  private readonly retryButton: Container;
  private logo?: Sprite;

  constructor(
    private readonly app: Application,
    private readonly style: LoadingScreenStyle,
    private readonly backgroundColor: ColorSource,
  ) {
    this.message = new Text({
      text: ERROR_MESSAGE,
      style: {
        fill: style.textColor,
        fontSize: 22,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: BAR_WIDTH,
      },
    });
    this.message.anchor.set(0.5, 0);
    this.retryButton = createRetryButton(style);
    this.content.addChild(this.bar, this.message, this.retryButton);
    this.view.addChild(this.background, this.content);
    this.setProgress(0);
    this.setErrorVisible(false);
    this.app.renderer.on('resize', this.layout);
    this.layout();
  }

  /** Shows the logo. Call once the preload bundle has loaded. */
  showLogo(): void {
    if (this.logo) {
      return;
    }
    this.logo = new Sprite(Assets.get<Texture>(this.style.logo));
    this.logo.anchor.set(0.5, 1);
    this.content.addChild(this.logo);
    this.layout();
  }

  /** `progress` from 0 to 1. */
  setProgress(progress: number): void {
    this.bar.clear().roundRect(0, 0, BAR_WIDTH, BAR_HEIGHT, BAR_HEIGHT / 2);
    this.bar.fill({ color: this.style.barColor, alpha: 0.25 });
    if (progress > 0) {
      const width = Math.max(BAR_HEIGHT, BAR_WIDTH * progress);
      this.bar.roundRect(0, 0, width, BAR_HEIGHT, BAR_HEIGHT / 2).fill(this.style.barColor);
    }
    this.app.render();
  }

  /** Shows the error and Retry. Resolves when the player presses Retry. */
  showError(): Promise<void> {
    this.setErrorVisible(true);
    return new Promise((resolve) => {
      this.retryButton.once('pointertap', () => {
        this.setErrorVisible(false);
        this.setProgress(0);
        resolve();
      });
    });
  }

  /** Fades out over the running game, then removes itself. Needs the ticker to be running. */
  async hide(): Promise<void> {
    await tween(
      this.app.ticker,
      this.view,
      { alpha: 0 },
      { duration: FADE_OUT_MS, easing: easeOutQuad },
    );
    this.app.renderer.off('resize', this.layout);
    this.view.destroy({ children: true });
  }

  private setErrorVisible(visible: boolean): void {
    this.message.visible = visible;
    this.retryButton.visible = visible;
    this.bar.visible = !visible;
    this.app.render();
  }

  private readonly layout = (): void => {
    const { width, height } = this.app.screen;
    this.background.clear().rect(0, 0, width, height).fill(this.backgroundColor);
    // The logo stands on the bar, the error replaces the bar. Together they are centered
    // on the screen: the content's origin is the top of the bar.
    this.bar.position.set(-BAR_WIDTH / 2, 0);
    this.retryButton.position.set(0, this.message.height + GAP);
    const logoHeight = this.fitLogo(width, height);
    const above = logoHeight > 0 ? logoHeight + GAP : 0;
    this.content.position.set(width / 2, height / 2 + (above - BAR_HEIGHT) / 2);
    this.app.render();
  };

  /** Scales the logo to the screen and puts it over the bar. Returns its height, 0 without a logo. */
  private fitLogo(width: number, height: number): number {
    if (!this.logo) {
      return 0;
    }
    const { texture } = this.logo;
    const maxWidth = Math.min(LOGO_MAX_WIDTH, width * LOGO_SCREEN_SHARE);
    const maxHeight = height * LOGO_SCREEN_HEIGHT_SHARE;
    this.logo.scale.set(Math.min(1, maxWidth / texture.width, maxHeight / texture.height));
    this.logo.position.set(0, -GAP);
    return this.logo.height;
  }
}

/** A pill-shaped button. Its position is the middle of its top edge. */
function createRetryButton(style: LoadingScreenStyle): Container {
  const frame = new Graphics()
    .roundRect(-BUTTON_WIDTH / 2, 0, BUTTON_WIDTH, BUTTON_HEIGHT, BUTTON_HEIGHT / 2)
    .fill({ color: style.barColor, alpha: 0.2 })
    .stroke({ color: style.barColor, width: 3 });
  const label = new Text({
    text: 'Retry',
    style: { fill: style.textColor, fontSize: 24, fontWeight: 'bold' },
  });
  label.anchor.set(0.5);
  label.y = BUTTON_HEIGHT / 2;
  return new Container({ children: [frame, label], eventMode: 'static', cursor: 'pointer' });
}
