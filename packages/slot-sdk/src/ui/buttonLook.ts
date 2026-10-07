import {
  Assets,
  Circle,
  Graphics,
  NineSliceSprite,
  Rectangle,
  Sprite,
  type ColorSource,
  type Container,
  type Texture,
} from 'pixi.js';

/** Look of a button. Sizes are in the coordinates of the layer it is added to. */
export interface ButtonStyle {
  /** A round button with `radius`, or a rounded rectangle of `width × height`. */
  shape: { radius: number } | { width: number; height: number };
  /** Fill of the plain shape, used when there is no `skin`. */
  color: ColorSource;
  textColor: ColorSource;
  fontFamily: string;
  fontSize: number;
  /**
   * A second, separately styled line under the label, e.g. a price. The label moves up to make
   * room for it while it has text.
   */
  caption?: { fontSize: number; color: ColorSource };
  /**
   * Alias of a texture from the manifest, drawn as the button instead of the plain shape.
   * A round button shows it at the size of its circle. A rectangular one stretches only its
   * middle, so the corners and ends of the art keep their shape at any width.
   */
  skin?: string;
  /** Touch area beyond the visible shape on every side: keeps small buttons easy to hit on a phone. */
  hitPadding?: number;
}

const rimWidth = 4;
const cornerRadiusShare = 0.3;
/** An icon fills this share of the button's height. */
const iconShare = 0.6;
/** The stretched middle of a rectangular skin starts this share of its height from each edge. */
const skinBorderShare = 0.45;

/** The skin of the style, or a plain shape in its color with a rim in its text color. */
export function drawBackground(style: ButtonStyle): Container {
  const { shape, skin } = style;
  if (skin) {
    return drawSkin(Assets.get<Texture>(skin), shape);
  }
  const graphics = new Graphics();
  if ('radius' in shape) {
    graphics.circle(0, 0, shape.radius);
  } else {
    const corner = Math.min(shape.width, shape.height) * cornerRadiusShare;
    graphics.roundRect(-shape.width / 2, -shape.height / 2, shape.width, shape.height, corner);
  }
  return graphics.fill(style.color).stroke({ width: rimWidth, color: style.textColor });
}

function drawSkin(texture: Texture, shape: ButtonStyle['shape']): Container {
  if ('radius' in shape) {
    const sprite = new Sprite({ texture, anchor: 0.5 });
    sprite.setSize(shape.radius * 2);
    return sprite;
  }
  const border = texture.height * skinBorderShare;
  return new NineSliceSprite({
    texture,
    leftWidth: border,
    rightWidth: border,
    topHeight: border,
    bottomHeight: border,
    width: shape.width,
    height: shape.height,
    anchor: 0.5,
  });
}

export function iconSize(shape: ButtonStyle['shape']): number {
  return ('radius' in shape ? shape.radius * 2 : shape.height) * iconShare;
}

export function hitArea(shape: ButtonStyle['shape'], padding: number): Circle | Rectangle {
  if ('radius' in shape) {
    return new Circle(0, 0, shape.radius + padding);
  }
  const width = shape.width + padding * 2;
  const height = shape.height + padding * 2;
  return new Rectangle(-width / 2, -height / 2, width, height);
}
