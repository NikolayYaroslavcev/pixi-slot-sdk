import {
  Assets,
  type AssetsManifest,
  type Renderer,
  type Texture,
  type UnresolvedAsset,
} from 'pixi.js';
import {
  isSymbolArt,
  type AssetEntry,
  type AssetManifest,
  type SymbolPlaceholder,
} from './AssetManifest';
import { LoadedAssets } from './LoadedAssets';
import { createSymbolPlaceholders } from './symbolPlaceholders';

const PRELOAD_BUNDLE = 'preload';
const GAME_BUNDLE = 'game';

/** Called as files of the game bundle finish loading, from 0 to 1. */
export type ProgressListener = (progress: number) => void;

/**
 * Loads a game's manifest through Pixi `Assets`: first `preload`, then `game`.
 * Pixi caches every file that loaded, so calling both again after a failure
 * fetches only the files that failed.
 */
export class AssetLoader {
  private initialized = false;

  constructor(
    private readonly manifest: AssetManifest,
    private readonly renderer: Renderer,
  ) {}

  /** Loads what the loading screen itself needs. */
  async loadPreload(): Promise<void> {
    await this.init();
    await Assets.loadBundle(PRELOAD_BUNDLE);
  }

  /**
   * Loads the game bundle with the symbol art in it, then draws placeholders for the symbols
   * without art. Call after `loadPreload`.
   */
  async loadGame(onProgress: ProgressListener): Promise<LoadedAssets> {
    await Assets.loadBundle(GAME_BUNDLE, onProgress);
    const placeholders: Record<string, SymbolPlaceholder> = {};
    const textures = new Map<string, Texture>();
    for (const [symbolId, symbol] of Object.entries(this.manifest.symbols)) {
      if (isSymbolArt(symbol)) {
        textures.set(symbolId, Assets.get<Texture>(symbolAlias(symbolId)));
      } else {
        placeholders[symbolId] = symbol;
      }
    }
    for (const [symbolId, texture] of createSymbolPlaceholders(this.renderer, placeholders)) {
      textures.set(symbolId, texture);
    }
    return new LoadedAssets(textures);
  }

  // Pixi ignores a second Assets.init with a warning, and a retry calls loadPreload again.
  private async init(): Promise<void> {
    if (this.initialized) {
      return;
    }
    await Assets.init({ manifest: toPixiManifest(this.manifest) });
    this.initialized = true;
  }
}

/** The manifest in the shape Pixi expects: two named bundles, symbol art inside `game`. */
export function toPixiManifest(manifest: AssetManifest): AssetsManifest {
  const symbolArt = Object.entries(manifest.symbols).flatMap(([symbolId, symbol]) =>
    isSymbolArt(symbol) ? [{ alias: symbolAlias(symbolId), src: symbol.src }] : [],
  );
  return {
    bundles: [
      { name: PRELOAD_BUNDLE, assets: manifest.preload.map(toPixiAsset) },
      { name: GAME_BUNDLE, assets: [...manifest.game.map(toPixiAsset), ...symbolArt] },
    ],
  };
}

/** Pixi alias of a symbol's art file. The prefix keeps it apart from the game's own aliases. */
function symbolAlias(symbolId: string): string {
  return `symbol:${symbolId}`;
}

function toPixiAsset({ alias, src, family, resolution }: AssetEntry): UnresolvedAsset {
  if (family) {
    return { alias, src, data: { family } };
  }
  return resolution ? { alias, src, data: { resolution } } : { alias, src };
}
