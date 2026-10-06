import type { Texture } from 'pixi.js';

/** Resources ready to use. Games get it as `context.assets`. */
export class LoadedAssets {
  constructor(private readonly symbolTextures: ReadonlyMap<string, Texture>) {}

  /** Texture of a symbol from `AssetManifest.symbols`. */
  symbolTexture(symbolId: string): Texture {
    const texture = this.symbolTextures.get(symbolId);
    if (!texture) {
      throw new Error(`LoadedAssets: symbol "${symbolId}" is not in assets.symbols`);
    }
    return texture;
  }
}
