import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ProgressListener } from './AssetLoader';
import { LoadedAssets } from './LoadedAssets';
import { loadAssetsWithRetry } from './loadAssetsWithRetry';

const loaded = new LoadedAssets(new Map());

function createScreen(log: string[]) {
  return {
    showLogo: vi.fn(() => {
      log.push('logo');
    }),
    setProgress: vi.fn((progress: number) => {
      log.push(`progress ${String(progress)}`);
    }),
    // Stands for the player pressing Retry right away.
    showError: vi.fn(() => {
      log.push('error');
      return Promise.resolve();
    }),
  };
}

function createLoader(log: string[]) {
  return {
    loadPreload: vi.fn(() => {
      log.push('preload');
      return Promise.resolve();
    }),
    loadGame: vi.fn((onProgress: ProgressListener) => {
      log.push('game');
      onProgress(0.5);
      onProgress(1);
      return Promise.resolve(loaded);
    }),
  };
}

describe('loadAssetsWithRetry', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads preload, shows the logo, then loads the game with progress', async () => {
    const log: string[] = [];

    await expect(loadAssetsWithRetry(createLoader(log), createScreen(log))).resolves.toBe(loaded);
    expect(log).toEqual(['preload', 'logo', 'game', 'progress 0.5', 'progress 1']);
  });

  it('logs the original error, waits for Retry and loads again', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const failure = new Error('[Loader.load] Failed to load assets/fonts/Title.woff2.');
    const log: string[] = [];
    const loader = createLoader(log);
    loader.loadGame.mockRejectedValueOnce(failure);

    await expect(loadAssetsWithRetry(loader, createScreen(log))).resolves.toBe(loaded);
    expect(log).toEqual([
      'preload',
      'logo',
      'error',
      'preload',
      'logo',
      'game',
      'progress 0.5',
      'progress 1',
    ]);
    expect(consoleError).toHaveBeenCalledWith(expect.any(String), failure);
  });

  it('retries a failed preload as many times as needed', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const loader = createLoader([]);
    loader.loadPreload
      .mockRejectedValueOnce(new Error('offline'))
      .mockRejectedValueOnce(new Error('offline'));
    const screen = createScreen([]);

    await loadAssetsWithRetry(loader, screen);

    expect(screen.showError).toHaveBeenCalledTimes(2);
    expect(loader.loadPreload).toHaveBeenCalledTimes(3);
    expect(loader.loadGame).toHaveBeenCalledTimes(1);
  });
});
