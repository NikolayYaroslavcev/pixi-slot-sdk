import { Assets, Texture, type Renderer } from 'pixi.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AssetLoader, toPixiManifest } from './AssetLoader';
import type { AssetManifest } from './AssetManifest';

// Drawing placeholders needs a real renderer, which Node does not have.
vi.mock('./symbolPlaceholders', () => ({
  createSymbolPlaceholders: () => new Map([['low', Texture.WHITE]]),
}));

const manifest: AssetManifest = {
  preload: [{ alias: 'logo', src: 'assets/logo.svg' }],
  game: [{ alias: 'title', src: 'assets/fonts/Title.woff2', family: 'Title' }],
  symbols: { low: { color: '#3366cc', label: 'Low' } },
};

function spyOnAssets() {
  const init = vi.spyOn(Assets, 'init').mockResolvedValue();
  const loadBundle = vi.spyOn(Assets, 'loadBundle').mockResolvedValue({});
  return { init, loadBundle };
}

describe('toPixiManifest', () => {
  it('turns the two lists into the preload and game bundles', () => {
    expect(toPixiManifest(manifest)).toEqual({
      bundles: [
        { name: 'preload', assets: [{ alias: 'logo', src: 'assets/logo.svg' }] },
        {
          name: 'game',
          assets: [{ alias: 'title', src: 'assets/fonts/Title.woff2', data: { family: 'Title' } }],
        },
      ],
    });
  });
});

describe('AssetLoader', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes Pixi Assets once, even when preload runs again on retry', async () => {
    const { init } = spyOnAssets();
    const loader = new AssetLoader(manifest, {} as Renderer);

    await loader.loadPreload();
    await loader.loadPreload();

    expect(init).toHaveBeenCalledTimes(1);
    expect(init).toHaveBeenCalledWith({ manifest: toPixiManifest(manifest) });
  });

  it('loads preload, then the game bundle with progress, and returns the symbol textures', async () => {
    const { loadBundle } = spyOnAssets();
    const onProgress = vi.fn();
    const loader = new AssetLoader(manifest, {} as Renderer);

    await loader.loadPreload();
    const assets = await loader.loadGame(onProgress);

    expect(loadBundle.mock.calls).toEqual([['preload'], ['game', onProgress]]);
    expect(assets.symbolTexture('low')).toBe(Texture.WHITE);
  });

  it('passes the loading error on unchanged', async () => {
    const failure = new Error('[Loader.load] Failed to load assets/logo.svg.');
    spyOnAssets().loadBundle.mockRejectedValue(failure);
    const loader = new AssetLoader(manifest, {} as Renderer);

    await expect(loader.loadPreload()).rejects.toBe(failure);
  });
});
