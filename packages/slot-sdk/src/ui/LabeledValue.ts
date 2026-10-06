import { Container, Text, type ColorSource } from 'pixi.js';

export interface LabeledValueStyle {
  fontFamily: string;
  captionColor: ColorSource;
  valueColor: ColorSource;
  captionFontSize: number;
  valueFontSize: number;
}

/** A small caption above a value, e.g. "BALANCE" over "1,000.00". Centered on its origin. */
export class LabeledValue {
  readonly view = new Container();
  private readonly value: Text;

  constructor(caption: string, style: LabeledValueStyle) {
    const { fontFamily } = style;
    // The caption ends and the value begins at y = 0, so the pair sits around the origin.
    const captionText = new Text({
      text: caption,
      anchor: { x: 0.5, y: 1 },
      style: { fill: style.captionColor, fontFamily, fontSize: style.captionFontSize },
    });
    this.value = new Text({
      text: '',
      anchor: { x: 0.5, y: 0 },
      style: { fill: style.valueColor, fontFamily, fontSize: style.valueFontSize },
    });
    this.view.addChild(captionText, this.value);
  }

  setValue(text: string): void {
    if (this.value.text !== text) {
      this.value.text = text;
    }
  }
}
