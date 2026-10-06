import {
  createRng,
  type ResultSource,
  type Rng,
  type RoundRequest,
  type RoundResult,
} from 'slot-sdk';
import { playSpin, spinSteps } from '../math/playSpin';
import { playlist, scenarios, type ScenarioName } from './scenarios';

export interface MockResultSourceOptions {
  /** Balance of the mock wallet at the start, minor units. */
  initialBalance: number;
  /** Pretend network time before every answer. */
  latencyMs: number;
  /** Plays only this scenario. Without it the mock goes through `playlist`. */
  scenario?: ScenarioName;
  /** Seed of every random choice of the rules: the same seed plays the same rounds. */
  seed: number;
}

/**
 * Stands in for the game server. It keeps the wallet, picks a fixed field, plays it
 * with the game rules and answers with a round script. Same scenario and seed, same round.
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
    if (request.bet > this.balance) {
      throw new Error('MockResultSource: the bet is higher than the balance');
    }
    const spin = playSpin(scenarios[scenario], request.bet, this.rng);
    const totalWin = spin.outcome.totalWin;
    this.balance += totalWin - request.bet;
    const steps = [...spinSteps(spin), { type: 'totalWin', amount: totalWin }];
    return { steps, totalWin, balance: this.balance };
  }

  private nextScenario(): ScenarioName {
    const fromPlaylist = playlist[this.roundCount % playlist.length] ?? 'nowin';
    this.roundCount += 1;
    return this.options.scenario ?? fromPlaylist;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
