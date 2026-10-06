import { describe, expect, it } from 'vitest';
import type { GameConfig } from './GameConfig';
import type { SlotGameOptions } from './SlotGame';
import { createSlotGame } from './createSlotGame';

function createOptions(config: Partial<GameConfig> = {}): SlotGameOptions {
  return {
    config: { initialBalance: 10_000, initialBet: 100, backgroundColor: '#000000', ...config },
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

  it('rejects a feature without install', () => {
    const options = { ...createOptions(), features: [{}] } as unknown as SlotGameOptions;

    expect(() => createSlotGame(options)).toThrow(
      'features[0] must have an install(context) method',
    );
  });
});
