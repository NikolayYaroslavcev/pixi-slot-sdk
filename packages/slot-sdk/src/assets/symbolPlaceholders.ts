import { Container, Graphics, Text, type Renderer, type Texture } from 'pixi.js';
import type { SymbolPlaceholder } from './AssetManifest';

// Big enough to stay sharp in a reel cell on a phone with devicePixelRatio 2.
const TILE_SIZE = 160;
const CORNER_RADIUS = 24;
const LABEL_PADDING = 16;

/**
 * Draws a texture for every symbol: a rounded tile in the symbol's color with its label.
 * Lets the reels show every symbol before the game has its art.
 */
export function createSymbolPlaceholders(
  renderer: Renderer,
  symbols: Readonly<Record<string, SymbolPlaceholder>>,
): Map<string, Texture> {
  const textures = new Map<string, Texture>();
  for (const [symbolId, placeholder] of Object.entries(symbols)) {
    textures.set(symbolId, drawPlaceholder(renderer, placeholder));
  }
  return textures;
}

function drawPlaceholder(renderer: Renderer, placeholder: SymbolPlaceholder): Texture {
  const tile = new Graphics()
    .roundRect(0, 0, TILE_SIZE, TILE_SIZE, CORNER_RADIUS)
    .fill(placeholder.color)
    // alignment 1 keeps the stroke inside, so the texture is exactly TILE_SIZE wide.
    .stroke({ width: 6, color: '#ffffff', alpha: 0.5, alignment: 1 });
  const label = new Text({
    text: placeholder.label,
    style: {
      fill: '#ffffff',
      fontSize: 40,
      fontWeight: 'bold',
      stroke: { color: '#000000', width: 6 },
    },
  });
  label.anchor.set(0.5);
  label.position.set(TILE_SIZE / 2);
  label.scale.set(Math.min(1, (TILE_SIZE - LABEL_PADDING * 2) / label.width));

  const group = new Container({ children: [tile, label] });
  const texture = renderer.generateTexture(group);
  group.destroy({ children: true });
  return texture;
}
