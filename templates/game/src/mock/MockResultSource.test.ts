import type { RevealStep } from 'slot-sdk';
import { describe, expect, it } from 'vitest';
import { paytable, type SymbolId } from '../config/symbols';
import { MockResultSource } from './MockResultSource';

const bet = 100;

function source(initialBalance = 100_000): MockResultSource {
  return new MockResultSource({ initialBalance, latencyMs: 0, seed: 7 });
}

describe('MockResultSource', () => {
  it('answers with a script from reveal to totalWin and settles the wallet', async () => {
    const mock = source();
    let balance = 100_000;
    for (let round = 0; round < 50; round += 1) {
      const result = await mock.play({ bet });
      balance += result.totalWin - bet;
      expect(result.steps[0]?.type).toBe('reveal');
      expect(result.steps.at(-1)).toEqual({ type: 'totalWin', amount: result.totalWin });
      expect(result.balance).toBe(balance);
    }
  });

  it('pays three of a kind on the middle row and nothing else', async () => {
    const mock = source();
    let wins = 0;
    for (let round = 0; round < 200; round += 1) {
      const result = await mock.play({ bet });
      const { grid } = result.steps[0] as RevealStep;
      const [first, ...rest] = grid.map((reel) => reel[1]) as SymbolId[];
      const lined = first !== undefined && rest.every((symbol) => symbol === first);
      expect(result.totalWin).toBe(lined ? bet * paytable[first] : 0);
      wins += lined ? 1 : 0;
    }
    expect(wins).toBeGreaterThan(0);
  });

  it('rejects a bet above the balance and an unknown mode', async () => {
    await expect(source(50).play({ bet })).rejects.toThrow('more than the balance');
    await expect(source().play({ bet, mode: 'no-such-mode' })).rejects.toThrow(
      'unknown round mode',
    );
  });
});
