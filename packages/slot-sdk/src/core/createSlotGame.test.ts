import { describe, expect, it } from 'vitest';
import { hudNodeNames, type HudStyle } from '../ui/Hud';
import type { GameConfig } from './GameConfig';
import type { SlotGameOptions } from './SlotGame';
import { createSlotGame } from './createSlotGame';

const hud: HudStyle = {
  fontFamily: 'Arial',
  textColor: '#ffffff',
  captionColor: '#cccccc',
  buttonColor: '#336699',
  buttonTextColor: '#ffffff',
  captionFontSize: 20,
  valueFontSize: 30,
  messageFontSize: 24,
  spinButton: { radius: 80, fontSize: 30 },
  betButtons: { size: 60, fontSize: 30, offset: 100 },
  texts: {
    balance: 'BALANCE',
    bet: 'BET',
    win: 'WIN',
    spin: 'SPIN',
    stop: 'STOP',
    skip: 'SKIP',
    idle: 'Press SPIN',
    spinning: 'Good luck',
    wins: 'Win',
    betReturned: 'Bet returned',
    roundError: 'Error',
    notEnoughBalance: 'Not enough balance',
  },
};

const bigWin = {
  title: 'BIG WIN',
  minBets: 10,
  countUpMs: 2000,
  holdMs: 1000,
  color: '#ffcc00',
  titleScale: 1,
  particlesPerSecond: 40,
};

const wins: GameConfig['wins'] = {
  timing: { allWinsMs: 1000, countUpMs: 600, eachWinMs: 700, totalWinMs: 500, fadeMs: 200 },
  bigWins: [bigWin],
  style: {
    fontFamily: 'Arial',
    lineColors: ['#ffffff'],
    lineWidth: 8,
    textColor: '#ffffff',
    outlineColor: '#000000',
    counterFontSize: 80,
    amountFontSize: 50,
    overlayColor: '#000000',
    overlayAlpha: 0.7,
    bigWinTitleSize: 120,
    bigWinCounterSize: 100,
    particles: { colors: ['#ffffff'], radius: 8, lifeMs: 1000, speed: 1000, gravity: 1000 },
  },
};

const hudNodes = Object.fromEntries(hudNodeNames.map((name) => [name, { x: 0, y: 0 }]));

function createOptions(config: Partial<GameConfig> = {}): SlotGameOptions {
  return {
    config: {
      initialBalance: 10_000,
      initialBet: 100,
      betLevels: [50, 100, 200],
      backgroundColor: '#000000',
      loadingScreen: { logo: 'logo', barColor: '#ffffff', textColor: '#ffffff' },
      wins,
      hud,
      ...config,
    },
    assets: {
      preload: [{ alias: 'logo', src: 'assets/logo.svg' }],
      game: [],
      symbols: { low: { color: '#3366cc', label: 'Low' } },
    },
    layout: {
      landscape: { width: 1920, height: 1080, nodes: hudNodes },
      portrait: { width: 1080, height: 1920, nodes: hudNodes },
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

  it('rejects bet levels that are not ascending or miss the initial bet', () => {
    expect(() => createSlotGame(createOptions({ betLevels: [200, 100] }))).toThrow(
      'config.betLevels must be positive integers in minor units, ascending, got [200, 100]',
    );
    expect(() => createSlotGame(createOptions({ betLevels: [50, 200] }))).toThrow(
      'config.initialBet 100 must be one of config.betLevels',
    );
  });

  it('rejects a layout without the HUD nodes', () => {
    const options = createOptions();
    const emptyVariant = { width: 1920, height: 1080, nodes: {} };
    const layout = { landscape: emptyVariant, portrait: emptyVariant };

    expect(() => createSlotGame({ ...options, layout })).toThrow(
      'layout.landscape.nodes is missing the HUD node "spinButton"',
    );
  });

  it('rejects a negative win presentation time', () => {
    const timing = { ...wins.timing, eachWinMs: -1 };
    expect(() => createSlotGame(createOptions({ wins: { ...wins, timing } }))).toThrow(
      'config.wins.timing.eachWinMs must be 0 or more milliseconds, got -1',
    );
  });

  it('rejects a Big Win tier without a threshold', () => {
    const bigWins = [{ ...bigWin, minBets: 0 }];
    expect(() => createSlotGame(createOptions({ wins: { ...wins, bigWins } }))).toThrow(
      'config.wins.bigWins[0] needs minBets above 0 and times of 0 or more milliseconds',
    );
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
