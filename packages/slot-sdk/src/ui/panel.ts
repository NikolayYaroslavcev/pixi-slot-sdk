import {
  Assets,
  Graphics,
  NineSliceSprite,
  type ColorSource,
  type Container,
  type Texture,
} from 'pixi.js';

/** Share of the skin's height its stretched middle starts from each edge. */
const skinBorderShare = 0.2;

/**
 * The background of a panel `width` wide and `height` tall, its top edge at y = 0 and centered
 * on x = 0. With a `panelSkin` it is that texture stretched in its middle, so the frame keeps its
 * corners; without one, a plain rounded rectangle.
 */
export function drawPanel(
  style: { panelSkin?: string; panelColor: ColorSource; padding: number },
  width: number,
  height: number,
): Container {
  if (!style.panelSkin) {
    return new Graphics()
      .roundRect(-width / 2, 0, width, height, style.padding / 2)
      .fill(style.panelColor);
  }
  const texture = Assets.get<Texture>(style.panelSkin);
  const border = texture.height * skinBorderShare;
  return new NineSliceSprite({
    texture,
    leftWidth: border,
    rightWidth: border,
    topHeight: border,
    bottomHeight: border,
    width,
    height,
    x: -width / 2,
  });
}
