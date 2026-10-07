import {
  createRng,
  randomIndex,
  type ResultSource,
  type Rng,
  type RoundRequest,
  type RoundResult,
  type StandardStep,
  type Win,
} from 'slot-sdk';
import { reelsConfig } from '../config/reels.config';
import { paytable, type SymbolGrid } from '../config/symbols';

export interface MockResultSourceOptions {
  /** Balance of the mock wallet at the start, minor units. */
  initialBalance: number;
  /** Pretend network time before every answer. */
  latencyMs: number;
  /** Seed of the random stops: the same seed plays the same rounds. */
  seed: number;
}

/**
 * Stands in for the game server: keeps the wallet, stops the reels at random and pays three of
 * a kind on the middle row. Swap it for a client of the real server; the rest of the game stays.
 */
export class MockResultSource implements ResultSource {
  private balance: number;
  private readonly rng: Rng;

  constructor(private readonly options: MockResultSourceOptions) {
    this.balance = options.initialBalance;
    this.rng = createRng(options.seed);
  }

  async play(request: RoundRequest): Promise<RoundResult> {
    await delay(this.options.latencyMs);
    if (request.mode !== undefined) {
      throw new Error(`MockResultSource: unknown round mode "${request.mode}"`);
    }
    if (request.bet > this.balance) {
      throw new Error('MockResultSource: the bet is more than the balance');
    }
    const grid = drawGrid(this.rng);
    const win = middleRowWin(grid, request.bet);
    const totalWin = win?.amount ?? 0;
    this.balance += totalWin - request.bet;
    const steps: StandardStep[] = [{ type: 'reveal', grid }];
    if (win) {
      steps.push({ type: 'wins', wins: [win], amount: win.amount });
    }
    steps.push({ type: 'totalWin', amount: totalWin });
    return { steps, totalWin, balance: this.balance };
  }
}

/** Each reel stops at a random place of its strip and shows the next symbols, wrapping at the end. */
function drawGrid(rng: Rng): SymbolGrid {
  const { strips, size } = reelsConfig;
  return strips.map((strip) => {
    const stop = randomIndex(rng, strip.length);
    return Array.from({ length: size.rowCount }, (_row, rowIndex) => {
      const symbol = strip[(stop + rowIndex) % strip.length];
      if (symbol === undefined) {
        throw new Error('MockResultSource: a reel strip is empty');
      }
      return symbol;
    });
  });
}

/** The same symbol on every reel of the middle row pays its paytable value times the bet. */
function middleRowWin(grid: SymbolGrid, bet: number): Win | undefined {
  const rowIndex = Math.floor(reelsConfig.size.rowCount / 2);
  const row = grid.map((reel) => reel[rowIndex]);
  const first = row[0];
  if (first === undefined || row.some((symbol) => symbol !== first)) {
    return undefined;
  }
  const cells = row.map((_symbol, reelIndex) => ({ reelIndex, rowIndex }));
  const pays = paytable[first];
  return { cells, path: cells, amount: bet * pays, caption: `×${String(pays)}` };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
