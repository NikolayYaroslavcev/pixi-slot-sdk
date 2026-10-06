import {
  createRng,
  type ResultSource,
  type Rng,
  type RoundRequest,
  type RoundResult,
} from 'slot-sdk';
import { bonusBuyConfig } from '../config/features.config';
import { bonusPrice, playBonusRound } from '../math/bonusBuy';
import { playRound, type PlayedRound } from '../math/playRound';
import { playlist, scenarios, type FieldScenario, type ScenarioName } from './scenarios';

export interface MockResultSourceOptions {
  /** Balance of the mock wallet at the start, minor units. */
  initialBalance: number;
  /** Pretend network time before every answer. */
  latencyMs: number;
  /**
   * Plays only this scenario, or every scenario in turn with `playlist`. Without it the reels
   * stop at random on their strips, as on a real server.
   */
  scenario?: ScenarioName;
  /** Seed of every random choice of the rules: the same seed plays the same rounds. */
  seed: number;
}

/**
 * Stands in for the game server. It keeps the wallet, lands the reels at random or on the field
 * of a scenario, plays the round with the game rules and answers with its script.
 * Same scenario and seed, same rounds.
 */
export class MockResultSource implements ResultSource {
  private balance: number;
  private roundCount = 0;
  private readonly rng: Rng;

  constructor(private readonly options: MockResultSourceOptions) {
    this.balance = options.initialBalance;
    this.rng = createRng(options.seed);
  }

  async play(request: RoundRequest): Promise<RoundResult> {
    await delay(this.options.latencyMs);
    const scenario = this.nextScenario();
    if (scenario === 'error') {
      throw new Error('MockResultSource: the "error" scenario fails on purpose');
    }
    const cost = this.costOf(request);
    if (cost > this.balance) {
      throw new Error('MockResultSource: the round costs more than the balance');
    }
    const { steps, totalWin } = this.playRequest(request, scenario);
    this.balance += totalWin - cost;
    return { steps, totalWin, balance: this.balance };
  }

  /** A server checks the mode and sets the price itself: the client only names what it wants. */
  private costOf(request: RoundRequest): number {
    if (request.mode === undefined) {
      return request.bet;
    }
    if (request.mode === bonusBuyConfig.mode) {
      return bonusPrice(request.bet);
    }
    throw new Error(`MockResultSource: unknown round mode "${request.mode}"`);
  }

  private playRequest(request: RoundRequest, scenario: FieldScenario | undefined): PlayedRound {
    if (request.mode === bonusBuyConfig.mode) {
      return playBonusRound(request.bet, this.rng);
    }
    return playRound(request.bet, this.rng, scenario && scenarios[scenario]);
  }

  /** The fixed field of the next round, `error`, or undefined for a random landing. */
  private nextScenario(): FieldScenario | 'error' | undefined {
    const { scenario } = this.options;
    if (scenario !== 'playlist') {
      return scenario;
    }
    const fromPlaylist = playlist[this.roundCount % playlist.length];
    this.roundCount += 1;
    return fromPlaylist;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
