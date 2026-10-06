import { Container, Graphics, Sprite, Text, Texture, type ColorSource, type Ticker } from 'pixi.js';
import type { LayoutManager } from '../layout/LayoutManager';
import { Button, type ButtonStyle } from './Button';

/** Look of a popup. Sizes are design pixels. */
export interface PopupStyle {
  width: number;
  padding: number;
  panelColor: ColorSource;
  /** Covers the screen behind the popup, so the game below reads as paused. */
  dimColor: ColorSource;
  dimAlpha: number;
  titleColor: ColorSource;
  titleFontSize: number;
  messageColor: ColorSource;
  messageFontSize: number;
  /** Buttons of the popup, side by side under the message. */
  button: Omit<ButtonStyle, 'shape'> & { width: number; height: number };
}

/** What a popup asks. Each button closes it with its `value`. */
export interface PopupContent {
  title: string;
  message: string;
  buttons: readonly { label: string; value: string }[];
}

/** Space between the parts of the popup, as a share of `padding`. */
const gapShare = 0.6;

/**
 * A modal dialog in the `popups` layer: a title, a message and a row of buttons over a dimmed
 * screen. It knows nothing about what it asks: `open` resolves with the value of the pressed
 * button, or `null` when the player closes it by tapping outside or pressing Escape.
 * While it is open nothing below it takes pointer input. It stays centered through resizes
 * and rotations.
 */
export class Popup {
  private readonly root = new Container({ label: 'popup', visible: false });
  private readonly dim = new Sprite(Texture.WHITE);
  private readonly panel = new Container();
  private readonly background = new Graphics();
  private readonly title: Text;
  private readonly message: Text;
  private buttons: Button[] = [];
  private answer: ((value: string | null) => void) | null = null;

  constructor(
    layer: Container,
    private readonly layout: LayoutManager,
    private readonly ticker: Ticker,
    private readonly style: PopupStyle,
  ) {
    this.dim.tint = style.dimColor;
    this.dim.alpha = style.dimAlpha;
    this.dim.eventMode = 'static';
    this.dim.on('pointertap', () => {
      this.close(null);
    });
    this.title = createText(style, style.titleColor, style.titleFontSize);
    this.message = createText(style, style.messageColor, style.messageFontSize);
    // The panel takes pointer events too, so a tap on it is not a tap outside.
    this.panel.eventMode = 'static';
    this.panel.addChild(this.background, this.title, this.message);
    this.root.addChild(this.dim, this.panel);
    layer.addChild(this.root);
    window.addEventListener('keydown', (event) => {
      if (event.code === 'Escape' && this.isOpen) {
        this.close(null);
      }
    });
  }

  get isOpen(): boolean {
    return this.answer !== null;
  }

  /** Shows the popup. A popup that is already open closes first, as if cancelled. */
  open(content: PopupContent): Promise<string | null> {
    this.close(null);
    this.title.text = content.title;
    this.message.text = content.message;
    this.createButtons(content.buttons);
    this.arrange();
    this.root.visible = true;
    this.place();
    this.ticker.add(this.place);
    return new Promise((resolve) => {
      this.answer = resolve;
    });
  }

  /** Hides the popup and resolves `open` with `value`. Does nothing when it is closed. */
  close(value: string | null): void {
    const answer = this.answer;
    if (!answer) {
      return;
    }
    this.answer = null;
    this.ticker.remove(this.place);
    this.root.visible = false;
    answer(value);
  }

  private createButtons(buttons: PopupContent['buttons']): void {
    for (const button of this.buttons) {
      button.view.destroy({ children: true });
    }
    const { width, height, ...look } = this.style.button;
    this.buttons = buttons.map(({ label, value }) => {
      const button = new Button({ ...look, shape: { width, height } }, label);
      button.onPress(() => {
        this.close(value);
      });
      this.panel.addChild(button.view);
      return button;
    });
  }

  /** Stacks title, message and buttons from the top of the panel and draws the panel around them. */
  private arrange(): void {
    const { width, padding, button } = this.style;
    const gap = padding * gapShare;
    this.title.y = padding;
    this.message.y = this.title.y + this.title.height + gap;
    const buttonsY = this.message.y + this.message.height + gap + button.height / 2;
    const rowWidth = this.buttons.length * button.width + (this.buttons.length - 1) * gap;
    this.buttons.forEach((each, index) => {
      each.view.position.set(
        -rowWidth / 2 + button.width / 2 + index * (button.width + gap),
        buttonsY,
      );
    });
    const height = buttonsY + button.height / 2 + padding;
    this.background
      .clear()
      .roundRect(-width / 2, 0, width, height, padding / 2)
      .fill(this.style.panelColor);
    this.panel.pivot.y = height / 2;
  }

  // An arrow function, so the ticker calls it with the right `this`.
  private readonly place = (): void => {
    const area = this.layout.visibleArea;
    const variant = this.layout.variant;
    if (!area || !variant) {
      return;
    }
    this.dim.position.set(area.x, area.y);
    this.dim.setSize(area.width, area.height);
    this.panel.position.set(variant.width / 2, variant.height / 2);
    this.panel.scale.set(Math.min(1, variant.width / (this.style.width + this.style.padding * 2)));
  };
}

/** A centered text that grows down from its top and wraps inside the panel. */
function createText(style: PopupStyle, fill: ColorSource, fontSize: number): Text {
  return new Text({
    anchor: { x: 0.5, y: 0 },
    style: {
      fill,
      fontSize,
      fontFamily: style.button.fontFamily,
      align: 'center',
      wordWrap: true,
      wordWrapWidth: style.width - style.padding * 2,
    },
  });
}
