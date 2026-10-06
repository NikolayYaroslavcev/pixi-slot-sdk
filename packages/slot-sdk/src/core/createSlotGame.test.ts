import { describe, expect, it } from 'vitest';
import type { GameConfig } from './GameConfig';
import type { SlotGameOptions } from './SlotGame';
import { createSlotGame } from './createSlotGame';

function createOptions(config: Partial<GameConfig> = {}): SlotGameOptions {
  return {
    config: {
      initialBalance: 10_000,
      initialBet: 100,
      backgroundColor: '#000000',
      loadingScreen: { logo: 'logo', barColor: '#ffffff', textColor: '#ffffff' },
      presentation: { winsMs: 1000, totalWinMs: 500 },
      ...config,
    },
    assets: {
      preload: [{ alias: 'logo', src: 'assets/logo.svg' }],
      game: [],
      symbols: { low: { color: '#3366cc', label: 'Low' } },
    },
    layout: {
      landscape: { width: 1920, height: 1080, nodes: {} },
      portrait: { width: 1080, height: 1920, nodes: {} },
    },
    resultSource: { play: () => Promise.reject(new Error('not used')) },
  };
}

describe('createSlotGame', () => {
  it('returns a game for valid options', () => {
    expect(createSlotGame(createOptions())).toBeDefined();
  });

  it('rejects a fractional bet with a readable message', () => {
    expect(() => createSlotGame(createOptions({ initialBet: 0.5 }))).toThrow(
      'config.initialBet must be a positive integer in minor units, got 0.5',
    );
  });

  it('rejects a zero bet', () => {
    expect(() => createSlotGame(createOptions({ initialBet: 0 }))).toThrow(/initialBet/);
  });

  it('lists every problem in one error', () => {
    expect(() => createSlotGame(createOptions({ initialBalance: -1, initialBet: 0 }))).toThrow(
      /initialBalance[\s\S]*initialBet/,
    );
  });

  it('rejects a negative presentation time', () => {
    expect(() =>
      createSlotGame(createOptions({ presentation: { winsMs: -1, totalWinMs: 500 } })),
    ).toThrow('config.presentation.winsMs must be 0 or more milliseconds, got -1');
  });

  it('rejects a feature without install', () => {
    const options = { ...createOptions(), features: [{}] } as unknown as SlotGameOptions;

    expect(() => createSlotGame(options)).toThrow(
      'features[0] must have an install(context) method',
    );
  });

  it('rejects a loading screen logo that is not preloaded', () => {
    const loadingScreen = { logo: 'missing', barColor: '#ffffff', textColor: '#ffffff' };

    expect(() => createSlotGame(createOptions({ loadingScreen }))).toThrow(
      'config.loadingScreen.logo "missing" must be an alias from assets.preload',
    );
  });

  it('reports manifest problems together with config problems', () => {
    const options = createOptions({ initialBet: 0 });
    options.assets = { ...options.assets, symbols: {} };

    expect(() => createSlotGame(options)).toThrow(/initialBet[\s\S]*assets\.symbols/);
  });

  it('reports layout problems', () => {
    const options = createOptions();
    options.layout.landscape.nodes = { logo: { x: 960, y: 100 } };

    expect(() => createSlotGame(options)).toThrow('layout.portrait.nodes is missing "logo"');
  });
});
