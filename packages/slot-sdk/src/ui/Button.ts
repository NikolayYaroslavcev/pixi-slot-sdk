import { Assets, Container, Sprite, Text, type Texture, type Ticker } from 'pixi.js';
import { drawBackground, hitArea, iconSize, type ButtonStyle } from './buttonLook';
import { PressFeedback } from './PressFeedback';

export type { ButtonStyle } from './buttonLook';

const disabledAlpha = 0.55;
const disabledTint = 0x7d8796;

/**
 * A button centered on its origin. Pixi pointer events cover mouse, touch and pen alike.
 * `view` belongs to the layout (position, scale); hover, press and the disabled look change
 * only its content. It shows a text label, optionally with a caption under it, or an icon.
 */
export class Button {
  readonly view = new Container();
  private readonly content = new Container();
  private background: Container;
  private readonly label: Text;
  private readonly caption: Text;
  private readonly icon = new Sprite({ anchor: 0.5, visible: false });
  private readonly feedback: PressFeedback;

  constructor(
    private readonly style: ButtonStyle,
    text: string,
    ticker: Ticker,
  ) {
    this.background = drawBackground(style);
    const { fontFamily, caption } = style;
    const textStyle = { fontFamily, align: 'center' } as const;
    this.label = new Text({
      text,
      anchor: 0.5,
      style: { ...textStyle, fill: style.textColor, fontSize: style.fontSize },
    });
    this.caption = new Text({
      anchor: 0.5,
      visible: false,
      style: { ...textStyle, fill: caption?.color ?? style.textColor, fontSize: caption?.fontSize },
    });
    this.icon.setSize(iconSize(style.shape));
    this.content.addChild(this.background, this.label, this.caption, this.icon);
    this.view.addChild(this.content);
    this.view.hitArea = hitArea(style.shape, style.hitPadding ?? 0);
    this.view.eventMode = 'static';
    this.view.cursor = 'pointer';
    this.feedback = new PressFeedback(this.view, this.content, ticker);
  }

  /** Calls `action` on a click or a tap. A press that slides off the button does not count. */
  onPress(action: () => void): void {
    this.view.on('pointertap', action);
  }

  /** Shows `text` as the label, in place of an icon, and `caption` under it if there is one. */
  setText(text: string, caption = ''): void {
    this.icon.visible = false;
    this.label.visible = true;
    if (this.label.text !== text) {
      this.label.text = text;
    }
    if (this.caption.text !== caption) {
      this.caption.text = caption;
    }
    this.caption.visible = caption !== '';
    this.stackLines();
  }

  /** Shows the texture with this alias as the label, e.g. a speaker for the sound button. */
  setIcon(alias: string): void {
    const texture = Assets.get<Texture>(alias);
    this.label.visible = false;
    this.caption.visible = false;
    this.icon.visible = true;
    if (this.icon.texture !== texture) {
      this.icon.texture = texture;
      this.icon.setSize(iconSize(this.style.shape));
    }
  }

  /** Draws the button with another skin from the manifest, e.g. Spin and Stop in two colors. */
  setSkin(alias: string): void {
    if (this.style.skin === alias) {
      return;
    }
    this.style.skin = alias;
    const next = drawBackground(this.style);
    this.content.addChildAt(next, 0);
    this.background.destroy();
    this.background = next;
  }

  /** A disabled button is dimmed and grayed and ignores the pointer. */
  setEnabled(enabled: boolean): void {
    this.view.eventMode = enabled ? 'static' : 'none';
    this.view.alpha = enabled ? 1 : disabledAlpha;
    this.content.tint = enabled ? 0xffffff : disabledTint;
    if (!enabled) {
      this.feedback.reset();
    }
  }

  /** With a caption the two lines share the middle of the button, each centered on its half. */
  private stackLines(): void {
    if (!this.caption.visible) {
      this.label.y = 0;
      return;
    }
    const labelSize = this.style.fontSize;
    const captionSize = this.style.caption?.fontSize ?? labelSize;
    const total = labelSize + captionSize;
    this.label.y = -total / 2 + labelSize / 2;
    this.caption.y = total / 2 - captionSize / 2;
  }
}
