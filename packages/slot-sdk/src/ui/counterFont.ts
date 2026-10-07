import { BitmapFont, Cache, type TextStyleOptions } from 'pixi.js';

/** What amounts and counts are written with: digits, separators, signs and the multiplier. */
const counterCharacters = [['0', '9'], '.,-+×x/ ', '$€'];
/** Glyphs are drawn at twice their size, so a counter stays sharp on high-density screens. */
const glyphResolution = 2;

/**
 * Name of a bitmap font for numbers in `style`, installed on first use. A counter changes its
 * text every frame while it counts; a bitmap font lays the digits out from one texture instead
 * of drawing a new canvas text each frame. Pixi's cache holds the font, so one style is
 * installed once however many counters use it. Call it after the style's font has loaded.
 */
export function counterFont(style: TextStyleOptions): string {
  const name = `counter ${JSON.stringify(style)}`;
  if (!Cache.has(`${name}-bitmap`)) {
    BitmapFont.install({
      name,
      style,
      chars: counterCharacters,
      resolution: glyphResolution,
    });
  }
  return name;
}
