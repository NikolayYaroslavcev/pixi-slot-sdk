import { Container, type Text, type Ticker } from 'pixi.js';
import { Button } from './Button';
import { drawPanel } from './panel';
import { createPopupText, type PopupContent, type PopupStyle } from './PopupStyle';

/** Space between the parts of the panel, as a share of `padding`. */
const gapShare = 0.6;

/**
 * The visible card of a popup: title, message, an optional body and a row of buttons, stacked
 * from the top on a panel drawn around them. `Popup` decides when it shows; this only builds it.
 * Its origin is the middle of its top edge, its pivot the middle of the card.
 */
export class PopupPanel {
  readonly view = new Container();
  private background: Container | null = null;
  private readonly title: Text;
  private readonly message: Text;
  private body: Container | null = null;
  private buttons: Button[] = [];
  private panelHeight = 0;

  constructor(
    private readonly style: PopupStyle,
    private readonly ticker: Ticker,
    /** Called with the `value` of a pressed button. */
    private readonly onPress: (value: string) => void,
  ) {
    const { fontFamily } = style.button;
    const titleFont = style.titleFontFamily ?? fontFamily;
    this.title = createPopupText(style, titleFont, style.titleColor, style.titleFontSize);
    this.message = createPopupText(style, fontFamily, style.messageColor, style.messageFontSize);
    // The panel takes pointer events too, so a tap on it is not a tap outside.
    this.view.eventMode = 'static';
    this.view.addChild(this.title, this.message);
  }

  get height(): number {
    return this.panelHeight;
  }

  show(content: PopupContent): void {
    this.title.text = content.title;
    this.message.text = content.message;
    this.setBody(content.body ?? null);
    this.createButtons(content.buttons);
    this.arrange();
  }

  /** Lets go of the body, which belongs to whoever opened the popup. */
  removeBody(): void {
    this.setBody(null);
  }

  private setBody(body: Container | null): void {
    if (this.body) {
      this.view.removeChild(this.body);
    }
    this.body = body;
    if (body) {
      this.view.addChild(body);
    }
  }

  private createButtons(buttons: PopupContent['buttons']): void {
    for (const button of this.buttons) {
      button.view.destroy({ children: true });
    }
    const { width, height, ...look } = this.style.button;
    this.buttons = buttons.map(({ label, value }, index) => {
      const main = index === 0 && buttons.length > 1 ? this.style.mainButton : undefined;
      const button = new Button({ ...look, ...main, shape: { width, height } }, label, this.ticker);
      button.onPress(() => {
        this.onPress(value);
      });
      this.view.addChild(button.view);
      return button;
    });
  }

  /** Stacks title, message, body and buttons from the top and draws the panel around them. */
  private arrange(): void {
    const { width, padding, button } = this.style;
    const gap = padding * gapShare;
    this.title.y = padding;
    this.message.y = this.title.y + this.title.height + gap;
    let y = this.message.y + (this.message.text ? this.message.height + gap : 0);
    if (this.body) {
      this.body.position.set(0, y);
      y += this.body.height + gap;
    }
    const buttonsY = y + button.height / 2;
    const rowWidth = this.buttons.length * button.width + (this.buttons.length - 1) * gap;
    this.buttons.forEach((each, index) => {
      each.view.position.set(
        -rowWidth / 2 + button.width / 2 + index * (button.width + gap),
        buttonsY,
      );
    });
    this.panelHeight = buttonsY + button.height / 2 + padding;
    this.background?.destroy();
    this.background = drawPanel(this.style, width, this.panelHeight);
    this.view.addChildAt(this.background, 0);
    this.view.pivot.y = this.panelHeight / 2;
  }
}
