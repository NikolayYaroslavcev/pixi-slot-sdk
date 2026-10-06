import type { Sprite, Texture } from 'pixi.js';
import type { HighlightData } from '../wins/Highlight';
import type { CellMetrics } from './reelGeometry';

/** Shows `texture` on the sprite, touching the sprite only when the texture changes. */
export function showTexture(sprite: Sprite, texture: Texture): void {
  if (sprite.texture !== texture) {
    sprite.texture = texture;
  }
}

/** Draws the symbol at the size and brightness of its `Highlight`, or plainly without one. */
export function showHighlight(
  sprite: Sprite,
  highlight: HighlightData | undefined,
  metrics: CellMetrics,
): void {
  const scale = highlight?.scale ?? 1;
  sprite.setSize(metrics.cellWidth * scale, metrics.cellHeight * scale);
  const tint = grayTint(highlight?.brightness ?? 1);
  if (sprite.tint !== tint) {
    sprite.tint = tint;
  }
}

/** A tint that darkens a sprite evenly: 1 keeps its colors, 0 makes it black. */
function grayTint(brightness: number): number {
  const level = Math.round(Math.min(Math.max(brightness, 0), 1) * 255);
  return (level << 16) | (level << 8) | level;
}
