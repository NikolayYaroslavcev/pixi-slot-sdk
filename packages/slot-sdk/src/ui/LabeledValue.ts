import {
  Assets,
  BitmapText,
  Container,
  NineSliceSprite,
  Text,
  type ColorSource,
  type Texture,
  type Ticker,
} from 'pixi.js';
import { easeOutQuad } from '../anim/easing';
import { tween, type Tween } from '../anim/tween';
import { counterFont } from './counterFont';

/** A plate behind a value, from a texture of the manifest. It stretches only in the middle. */
export interface ValuePanelStyle {
  skin: string;
  width: number;
  height: number;
}

/** Look of a caption over a value, e.g. BALANCE over the amount. Sizes are design pixels. */
export interface LabeledValueStyle {
  fontFamily: string;
  captionColor: ColorSource;
  valueColor: ColorSource;
  captionFontSize: number;
  valueFontSize: number;
  /** Drawn behind the caption and the value. Without it the pair stands on its own. */
  valuePanel?: ValuePanelStyle;
}

/** How far a value grows when it changes, and how long it takes to settle back. */
const pulseScale = 1.18;
const pulseMs = 220;
/** Space between the caption and the value. */
const lineGap = 6;
/** Share of the plate's height its stretched middle starts from each edge. */
const panelBorderShare = 0.4;

/**
 * A small caption above a value, e.g. "BALANCE" over "1,000.00". Centered on its origin.
 * The value is a counter in a bitmap font; the caption is ordinary text.
 */
export class LabeledValue {
  readonly view = new Container();
  private readonly value: BitmapText;
  private pulsing: Tween<{ x: number; y: number }> | null = null;

  constructor(caption: string, style: LabeledValueStyle) {
    const { fontFamily, captionFontSize, valueFontSize } = style;
    // Text boxes carry room for descenders that captions and numbers never use, so the pair is
    // stacked by font size, not by box: both lines centered on their own middle, the whole block
    // centered on the origin and so on the plate. The value also swells from its middle.
    const blockHeight = captionFontSize + lineGap + valueFontSize;
    const captionText = new Text({
      text: caption,
      anchor: 0.5,
      y: -blockHeight / 2 + captionFontSize / 2,
      style: { fill: style.captionColor, fontFamily, fontSize: captionFontSize },
    });
    const valueStyle = { fill: style.valueColor, fontFamily, fontSize: valueFontSize };
    this.value = new BitmapText({
      text: '',
      anchor: 0.5,
      y: blockHeight / 2 - valueFontSize / 2,
      style: { fontFamily: counterFont(valueStyle), fontSize: valueFontSize },
    });
    if (style.valuePanel) {
      this.view.addChild(createPanel(style.valuePanel));
    }
    this.view.addChild(captionText, this.value);
  }

  setValue(text: string): void {
    if (this.value.text !== text) {
      this.value.text = text;
    }
  }

  /** A short swell of the value, so a change the player made or earned catches the eye. */
  pulse(ticker: Ticker): void {
    this.pulsing?.finish();
    this.value.scale.set(pulseScale);
    this.pulsing = tween(
      ticker,
      this.value.scale,
      { x: 1, y: 1 },
      { duration: pulseMs, easing: easeOutQuad },
    );
  }
}

function createPanel({ skin, width, height }: ValuePanelStyle): NineSliceSprite {
  const texture = Assets.get<Texture>(skin);
  const border = texture.height * panelBorderShare;
  return new NineSliceSprite({
    texture,
    leftWidth: border,
    rightWidth: border,
    topHeight: border,
    bottomHeight: border,
    width,
    height,
    anchor: 0.5,
  });
}
