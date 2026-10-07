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

describe('toPixiManifest with a dense SVG', () => {
  it('passes the resolution an SVG is drawn at', () => {
    const dense: AssetManifest = {
      ...manifest,
      game: [{ alias: 'plate', src: 'assets/plate.svg', resolution: 2 }],
    };

    expect(toPixiManifest(dense).bundles[1]?.assets).toEqual([
      { alias: 'plate', src: 'assets/plate.svg', data: { resolution: 2 } },
    ]);
  });
});

describe('toPixiManifest with symbol art', () => {
  it('loads art files of symbols with the game bundle, under their own aliases', () => {
    const withArt: AssetManifest = {
      ...manifest,
      symbols: { ...manifest.symbols, high: { src: 'assets/symbols/high.svg' } },
    };

    expect(toPixiManifest(withArt).bundles[1]?.assets).toEqual([
      { alias: 'title', src: 'assets/fonts/Title.woff2', data: { family: 'Title' } },
      { alias: 'symbol:high', src: 'assets/symbols/high.svg' },
    ]);
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

  it('takes the texture of a symbol with art from the loaded files', async () => {
    spyOnAssets();
    const art = new Texture();
    const get = vi.spyOn(Assets, 'get').mockReturnValue(art as unknown as Record<string, unknown>);
    const withArt: AssetManifest = {
      ...manifest,
      symbols: { ...manifest.symbols, high: { src: 'assets/symbols/high.svg' } },
    };
    const loader = new AssetLoader(withArt, {} as Renderer);

    await loader.loadPreload();
    const assets = await loader.loadGame(vi.fn());

    expect(get).toHaveBeenCalledWith('symbol:high');
    expect(assets.symbolTexture('high')).toBe(art);
    expect(assets.symbolTexture('low')).toBe(Texture.WHITE);
  });

  it('passes the loading error on unchanged', async () => {
    const failure = new Error('[Loader.load] Failed to load assets/logo.svg.');
    spyOnAssets().loadBundle.mockRejectedValue(failure);
    const loader = new AssetLoader(manifest, {} as Renderer);

    await expect(loader.loadPreload()).rejects.toBe(failure);
  });
});
