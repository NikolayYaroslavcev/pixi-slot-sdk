import { Circle, Container, Graphics, Rectangle, Text, type ColorSource } from 'pixi.js';

/** Look of a button. Sizes are in the coordinates of the layer it is added to. */
export interface ButtonStyle {
  /** A round button with `radius`, or a rounded rectangle of `width × height`. */
  shape: { radius: number } | { width: number; height: number };
  color: ColorSource;
  textColor: ColorSource;
  fontFamily: string;
  fontSize: number;
}

// Feedback of the button itself, the same in every game.
const hoverAlpha = 0.85;
const pressedScale = 0.94;
const disabledAlpha = 0.4;
const rimWidth = 4;
const cornerRadiusShare = 0.3;

/**
 * A button centered on its origin. Pixi pointer events cover mouse, touch and pen alike.
 * `view` belongs to the layout (position, scale), the press effect scales only its content.
 */
export class Button {
  readonly view = new Container();
  private readonly content = new Container();
  private readonly label: Text;

  constructor(style: ButtonStyle, text: string) {
    const background = drawBackground(style);
    this.label = new Text({
      text,
      anchor: 0.5,
      style: {
        fill: style.textColor,
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        align: 'center',
      },
    });
    this.content.addChild(background, this.label);
    this.view.addChild(this.content);
    this.view.hitArea = hitArea(style.shape);
    this.view.eventMode = 'static';
    this.view.cursor = 'pointer';
    this.view.on('pointerover', () => (background.alpha = hoverAlpha));
    this.view.on('pointerout', () => (background.alpha = 1));
    this.view.on('pointerdown', () => this.content.scale.set(pressedScale));
    this.view.on('pointerup', () => this.content.scale.set(1));
    this.view.on('pointerupoutside', () => this.content.scale.set(1));
  }

  /** Calls `action` on a click or a tap. A press that slides off the button does not count. */
  onPress(action: () => void): void {
    this.view.on('pointertap', action);
  }

  setText(text: string): void {
    if (this.label.text !== text) {
      this.label.text = text;
    }
  }

  /** A disabled button is dimmed and ignores the pointer. */
  setEnabled(enabled: boolean): void {
    this.view.eventMode = enabled ? 'static' : 'none';
    this.view.alpha = enabled ? 1 : disabledAlpha;
    if (!enabled) {
      this.content.scale.set(1);
    }
  }
}

function drawBackground(style: ButtonStyle): Graphics {
  const { shape } = style;
  const graphics = new Graphics();
  if ('radius' in shape) {
    graphics.circle(0, 0, shape.radius);
  } else {
    const corner = Math.min(shape.width, shape.height) * cornerRadiusShare;
    graphics.roundRect(-shape.width / 2, -shape.height / 2, shape.width, shape.height, corner);
  }
  return graphics.fill(style.color).stroke({ width: rimWidth, color: style.textColor });
}

function hitArea(shape: ButtonStyle['shape']): Circle | Rectangle {
  if ('radius' in shape) {
    return new Circle(0, 0, shape.radius);
  }
  return new Rectangle(-shape.width / 2, -shape.height / 2, shape.width, shape.height);
}
