import { Texture } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import { LoadedAssets } from './LoadedAssets';

describe('LoadedAssets', () => {
  it('returns the texture of a known symbol', () => {
    const assets = new LoadedAssets(new Map([['wild', Texture.WHITE]]));

    expect(assets.symbolTexture('wild')).toBe(Texture.WHITE);
  });

  it('names the unknown symbol in the error', () => {
    expect(() => new LoadedAssets(new Map()).symbolTexture('crown')).toThrow(
      'LoadedAssets: symbol "crown" is not in assets.symbols',
    );
  });
});
