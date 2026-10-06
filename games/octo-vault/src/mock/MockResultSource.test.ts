import type { RevealStep, RoundResult, WinsStep } from 'slot-sdk';
import { describe, expect, it, vi } from 'vitest';
import { gameConfig } from '../config/game.config';
import { reelsConfig } from '../config/reels.config';
import { symbols, type SymbolId } from '../config/symbols';
import { evaluateSpin } from '../math/evaluateSpin';
import { MockResultSource } from './MockResultSource';
import { playlist, scenarioFromAddress, scenarios, type FieldScenario } from './scenarios';

const bet = 100;

function createSource(scenario?: FieldScenario | 'error') {
  return new MockResultSource({ initialBalance: 10_000, latencyMs: 0, scenario, seed: 1 });
}

function stepTypes(result: RoundResult): string[] {
  return result.steps.map((step) => step.type);
}

describe('Octo Vault scenarios', () => {
  it('are 5 × 4 fields of known symbols with the Octopus only on reels 2–4', () => {
    const { reelCount, rowCount } = reelsConfig.size;
    for (const grid of Object.values(scenarios)) {
      expect(grid).toHaveLength(reelCount);
      grid.forEach((column: readonly SymbolId[], reelIndex) => {
        expect(column).toHaveLength(rowCount);
        expect(column.every((symbolId) => Object.hasOwn(symbols, symbolId))).toBe(true);
        expect(column.includes('octopus') && (reelIndex === 0 || reelIndex === 4)).toBe(false);
      });
    }
  });

  it('give the outcome their name promises', () => {
    expect(evaluateSpin(scenarios.nowin, bet).totalWin).toBe(0);
    expect(evaluateSpin(scenarios.win, bet).wins).toHaveLength(1);
    expect(evaluateSpin(scenarios.multiwin, bet).wins.length).toBeGreaterThanOrEqual(2);
    expect(evaluateSpin(scenarios.scatter, bet).scatters.length).toBeGreaterThanOrEqual(3);
  });

  it('reach the Big Win and Mega Win thresholds of the game config', () => {
    const [big, mega] = gameConfig.wins.bigWins.map((tier) => tier.minBets * bet);
    const bigWin = evaluateSpin(scenarios.bigwin, bet).totalWin;

    expect(bigWin).toBeGreaterThanOrEqual(big ?? Infinity);
    expect(bigWin).toBeLessThan(mega ?? 0);
    expect(evaluateSpin(scenarios.megawin, bet).totalWin).toBeGreaterThanOrEqual(mega ?? Infinity);
  });

  it('use the Wild in a paying line of the wild scenario', () => {
    const { wins } = evaluateSpin(scenarios.wild, bet);
    const wildInWin = wins.some((win) =>
      win.cells.some((cell) => scenarios.wild[cell.reelIndex]?.[cell.rowIndex] === 'octopus'),
    );

    expect(wildInWin).toBe(true);
  });

  it('are read from the page address', () => {
    expect(scenarioFromAddress('?scenario=bigwin')).toBe('bigwin');
    expect(scenarioFromAddress('?scenario=error')).toBe('error');
    expect(scenarioFromAddress('')).toBeUndefined();
  });

  it('ignore an unknown name in the address and say so', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(scenarioFromAddress('?scenario=jackpot')).toBeUndefined();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Unknown scenario "jackpot"'));
    warn.mockRestore();
  });
});

describe('MockResultSource', () => {
  it('answers a winning round with reveal, wins and totalWin', async () => {
    const result = await createSource('win').play({ bet });
    const [reveal, wins] = result.steps as [RevealStep, WinsStep];

    expect(stepTypes(result)).toEqual(['reveal', 'wins', 'totalWin']);
    expect(reveal.grid).toEqual(scenarios.win);
    expect(wins.amount).toBe(result.totalWin);
    expect(result.totalWin).toBe(evaluateSpin(scenarios.win, bet).totalWin);
  });

  it('leaves the wins step out of a round without a win', async () => {
    const result = await createSource('nowin').play({ bet });

    expect(stepTypes(result)).toEqual(['reveal', 'totalWin']);
    expect(result.totalWin).toBe(0);
  });

  it('takes the bet and pays the win from its own wallet', async () => {
    const source = createSource('win');

    const first = await source.play({ bet });
    const second = await source.play({ bet });

    expect(first.balance).toBe(10_000 - bet + first.totalWin);
    expect(second.balance).toBe(first.balance - bet + second.totalWin);
  });

  it('goes through the playlist when no scenario is chosen', async () => {
    const source = createSource();
    const grids: unknown[] = [];
    while (grids.length < playlist.length) {
      const result = await source.play({ bet });
      grids.push((result.steps[0] as RevealStep).grid);
    }

    expect(grids).toEqual(playlist.map((name) => scenarios[name]));
  });

  it('takes the bet once for a round with free spins', async () => {
    const result = await createSource('scatter').play({ bet });

    expect(stepTypes(result)).toContain('freeSpinsStart');
    expect(result.balance).toBe(10_000 - bet + result.totalWin);
  });

  it('throws the tentacles of a landed Octopus before the wins', async () => {
    const result = await createSource('tentacles').play({ bet });

    expect(stepTypes(result).slice(0, 2)).toEqual(['reveal', 'tentacles']);
  });

  it('gives the same round for the same scenario and seed', async () => {
    expect(await createSource('wild').play({ bet })).toEqual(
      await createSource('wild').play({ bet }),
    );
  });

  it('rejects every round of the error scenario', async () => {
    const source = createSource('error');

    await expect(source.play({ bet })).rejects.toThrow('fails on purpose');
    await expect(source.play({ bet })).rejects.toThrow('fails on purpose');
  });

  it('rejects a bet above its balance', async () => {
    const source = new MockResultSource({
      initialBalance: 50,
      latencyMs: 0,
      scenario: 'win',
      seed: 1,
    });

    await expect(source.play({ bet })).rejects.toThrow('higher than the balance');
  });

  it('answers only after the pretend network time', async () => {
    vi.useFakeTimers();
    const source = new MockResultSource({
      initialBalance: 10_000,
      latencyMs: 300,
      scenario: 'win',
      seed: 1,
    });
    const answered = vi.fn();
    void source.play({ bet }).then(answered);

    await vi.advanceTimersByTimeAsync(299);
    expect(answered).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(answered).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });
});
