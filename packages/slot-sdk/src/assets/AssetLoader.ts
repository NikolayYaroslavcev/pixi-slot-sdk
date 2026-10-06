import { Assets, type AssetsManifest, type Renderer, type UnresolvedAsset } from 'pixi.js';
import type { AssetEntry, AssetManifest } from './AssetManifest';
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

  /** Loads the game bundle, then draws the symbol placeholders. Call after `loadPreload`. */
  async loadGame(onProgress: ProgressListener): Promise<LoadedAssets> {
    await Assets.loadBundle(GAME_BUNDLE, onProgress);
    return new LoadedAssets(createSymbolPlaceholders(this.renderer, this.manifest.symbols));
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

/** The manifest in the shape Pixi expects: two named bundles. */
export function toPixiManifest(manifest: AssetManifest): AssetsManifest {
  return {
    bundles: [
      { name: PRELOAD_BUNDLE, assets: manifest.preload.map(toPixiAsset) },
      { name: GAME_BUNDLE, assets: manifest.game.map(toPixiAsset) },
    ],
  };
}

function toPixiAsset({ alias, src, family }: AssetEntry): UnresolvedAsset {
  return family ? { alias, src, data: { family } } : { alias, src };
}
