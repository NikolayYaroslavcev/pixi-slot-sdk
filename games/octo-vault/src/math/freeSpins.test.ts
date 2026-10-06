import { createRng } from 'slot-sdk';
import { describe, expect, it } from 'vitest';
import { scenarios } from '../mock/scenarios';
import { multiplierAt, sameCell } from './field';
import { freeSpinsFor, playFreeSpins } from './freeSpins';
import { playRound } from './playRound';
import { stickyWilds } from './playSpin';
import type { FreeSpinsEndStep, FreeSpinsStartStep, FreeSpinsUpdateStep } from './steps';

const bet = 100;

function stepsOf(steps: readonly { type: string }[], type: string) {
  return steps.filter((step) => step.type === type);
}

describe('freeSpinsFor', () => {
  it('gives 8, 10 and 12 spins for 3, 4 and 5 Scatters, none for fewer', () => {
    expect([0, 1, 2, 3, 4, 5, 6].map((count) => freeSpinsFor(count))).toEqual([
      0, 0, 0, 8, 10, 12, 12,
    ]);
  });
});

describe('free spins in a round', () => {
  it.each([
    ['scatter', 8],
    ['freespins4', 10],
    ['freespins5', 12],
  ] as const)('start from the %s field with %i spins', (scenario, count) => {
    const round = playRound(bet, createRng(1), scenarios[scenario]);
    const [start] = stepsOf(round.steps, 'freeSpinsStart') as FreeSpinsStartStep[];

    expect(round.freeSpins?.spins).toHaveLength(count);
    expect(start?.count).toBe(count);
    expect(start?.scatters).toEqual(round.base?.outcome.scatters);
    expect(stepsOf(round.steps, 'freeSpinsUpdate')).toHaveLength(count);
    expect(stepsOf(round.steps, 'reveal')).toHaveLength(count + 1);
  });

  it('play the series between its start and its end, and the total last', () => {
    const types = playRound(bet, createRng(2), scenarios.scatter).steps.map((step) => step.type);
    const start = types.indexOf('freeSpinsStart');

    expect(types[0]).toBe('reveal');
    expect(types.slice(start + 1, start + 3)).toEqual(['freeSpinsUpdate', 'reveal']);
    expect(types.slice(-2)).toEqual(['freeSpinsEnd', 'totalWin']);
  });

  it('do not start without 3 Scatters', () => {
    const round = playRound(bet, createRng(2), scenarios.win);

    expect(round.freeSpins).toBeUndefined();
    expect(stepsOf(round.steps, 'freeSpinsStart')).toEqual([]);
  });

  it('count the series win spin by spin and add it to the round total', () => {
    const round = playRound(bet, createRng(4), scenarios.scatter);
    const spins = round.freeSpins?.spins ?? [];
    const updates = stepsOf(round.steps, 'freeSpinsUpdate') as FreeSpinsUpdateStep[];
    const [end] = stepsOf(round.steps, 'freeSpinsEnd') as FreeSpinsEndStep[];
    const seriesWin = spins.reduce((sum, { spin }) => sum + spin.outcome.totalWin, 0);

    let before = 0;
    updates.forEach((update, index) => {
      expect(update.seriesWin).toBe(before);
      before += spins[index]?.spin.outcome.totalWin ?? 0;
    });
    expect(end?.seriesWin).toBe(seriesWin);
    expect(round.totalWin).toBe((round.base?.outcome.totalWin ?? 0) + seriesWin);
    expect(round.steps.at(-1)).toEqual({ type: 'totalWin', amount: round.totalWin });
  });
});

describe('playFreeSpins', () => {
  const series = playFreeSpins(12, bet, createRng(21));

  it('keeps every Wild of a spin, with its multiplier, for the next spins', () => {
    series.spins.forEach(({ sticky, spin }, index) => {
      const previous = series.spins[index - 1];
      expect(sticky).toEqual(previous ? stickyWilds(previous.spin.field) : []);
      for (const wild of sticky) {
        expect(spin.landed[wild.cell.reelIndex]?.[wild.cell.rowIndex]).toBe('octopus');
        expect(multiplierAt(spin.field.multipliers, wild.cell)).toBe(wild.multiplier);
      }
    });
  });

  it('adds new Wilds and never loses one before the end', () => {
    const last = series.spins.at(-1);

    expect(last?.sticky.length).toBeGreaterThan(0);
    series.spins.forEach(({ sticky }, index) => {
      const next = series.spins[index + 1];
      for (const wild of sticky) {
        expect(next?.sticky.some((kept) => sameCell(kept.cell, wild.cell)) ?? true).toBe(true);
      }
    });
  });

  it('lets only newly landed Octopuses grab', () => {
    for (const { sticky, spin } of series.spins) {
      for (const grab of spin.grabs) {
        expect(sticky.some((wild) => sameCell(wild.cell, grab.from))).toBe(false);
      }
    }
  });

  it('plays exactly the given count, whatever Scatters land inside', () => {
    for (let seed = 1; seed <= 30; seed += 1) {
      expect(playFreeSpins(8, bet, createRng(seed)).spins).toHaveLength(8);
    }
  });

  it('plays the same series for the same seed', () => {
    expect(playFreeSpins(10, bet, createRng(5))).toEqual(playFreeSpins(10, bet, createRng(5)));
  });
});
