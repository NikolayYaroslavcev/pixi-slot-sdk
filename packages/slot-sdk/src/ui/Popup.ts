import { Container, type Sprite, type Ticker } from 'pixi.js';
import { easeOutBack, easeOutQuad } from '../anim/easing';
import { tween } from '../anim/tween';
import type { LayoutManager } from '../layout/LayoutManager';
import { createDim, placeOverlay } from './overlay';
import { PopupPanel } from './PopupPanel';
import type { PopupContent, PopupStyle } from './PopupStyle';

export type { PopupContent, PopupStyle } from './PopupStyle';

/** The panel never takes more than this share of the screen height. */
const maxHeightShare = 0.94;
const openMs = 220;
const closeMs = 140;
const popFromScale = 0.88;

/**
 * A modal dialog in the `popups` layer: a `PopupPanel` over a dimmed screen. It knows nothing about
 * what it asks: `open` resolves with the value of the pressed button, or `null` when the player
 * closes it by tapping outside or pressing Escape. While it is open nothing below it takes pointer
 * input. It pops in and fades out, and stays centered and inside the screen through resizes and
 * rotations.
 */
export class Popup {
  private readonly root = new Container({ label: 'popup', visible: false });
  private readonly dim: Sprite;
  private readonly panel: PopupPanel;
  private answer: ((value: string | null) => void) | null = null;
  private readonly pressListeners: (() => void)[] = [];
  private readonly pop = { scale: 1 };
  private fades: { finish(): void }[] = [];

  constructor(
    layer: Container,
    private readonly layout: LayoutManager,
    private readonly ticker: Ticker,
    private readonly style: PopupStyle,
  ) {
    this.dim = createDim(style.dimColor, style.dimAlpha);
    this.dim.eventMode = 'static';
    this.dim.on('pointertap', () => {
      this.close(null);
    });
    this.panel = new PopupPanel(style, ticker, (value) => {
      for (const listener of this.pressListeners) {
        listener();
      }
      this.close(value);
    });
    this.root.addChild(this.dim, this.panel.view);
    layer.addChild(this.root);
    window.addEventListener('keydown', (event) => {
      if (event.code === 'Escape' && this.isOpen) {
        this.close(null);
      }
    });
  }

  /** Calls `listener` whenever a button of the popup is pressed, e.g. for a click sound. */
  onButtonPress(listener: () => void): void {
    this.pressListeners.push(listener);
  }

  get isOpen(): boolean {
    return this.answer !== null;
  }

  /** Shows the popup. A popup that is already open closes first, as if cancelled. */
  open(content: PopupContent): Promise<string | null> {
    this.close(null);
    this.finishFades();
    this.panel.show(content);
    this.root.visible = true;
    this.root.eventMode = 'static';
    this.appear();
    this.place();
    this.ticker.add(this.place);
    return new Promise((resolve) => {
      this.answer = resolve;
    });
  }

  /**
   * Resolves `open` with `value` and fades the popup out. Input below is free at once:
   * the fade is only a look. Does nothing when it is closed.
   */
  close(value: string | null): void {
    const answer = this.answer;
    if (!answer) {
      return;
    }
    this.answer = null;
    this.root.eventMode = 'none';
    this.finishFades();
    const fading = tween(this.ticker, this.root, { alpha: 0 }, { duration: closeMs });
    this.fades = [fading];
    void fading.then(() => {
      if (!this.answer) {
        this.hide();
      }
    });
    answer(value);
  }

  private appear(): void {
    this.root.alpha = 0;
    this.pop.scale = popFromScale;
    this.fades = [
      tween(this.ticker, this.root, { alpha: 1 }, { duration: openMs, easing: easeOutQuad }),
      tween(this.ticker, this.pop, { scale: 1 }, { duration: openMs, easing: easeOutBack }),
    ];
  }

  private hide(): void {
    this.ticker.remove(this.place);
    this.root.visible = false;
    this.panel.removeBody();
  }

  private finishFades(): void {
    for (const fade of this.fades) {
      fade.finish();
    }
    this.fades = [];
  }

  private readonly place = (): void => {
    const { width, padding } = this.style;
    placeOverlay(
      this.layout,
      { dim: this.dim, content: this.panel.view },
      {
        width: width + padding * 2,
        height: this.panel.height,
        maxWidthShare: 1,
        maxHeightShare,
        scale: this.pop.scale,
      },
    );
  };
}
