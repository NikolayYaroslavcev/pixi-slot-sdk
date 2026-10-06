import type { ResultSource, RoundRequest, RoundResult, StandardStep } from 'slot-sdk';
import type { SymbolGrid } from '../config/symbols';
import { evaluateSpin, type SpinOutcome } from '../math/evaluateSpin';
import { playlist, scenarios, type ScenarioName } from './scenarios';

export interface MockResultSourceOptions {
  /** Balance of the mock wallet at the start, minor units. */
  initialBalance: number;
  /** Pretend network time before every answer. */
  latencyMs: number;
  /** Plays only this scenario. Without it the mock goes through `playlist`. */
  scenario?: ScenarioName;
}

/**
 * Stands in for the game server. It keeps the wallet, picks a fixed field, evaluates it
 * with the game math and answers with a round script. Same scenario, same round.
 */
export class MockResultSource implements ResultSource {
  private balance: number;
  private roundCount = 0;

  constructor(private readonly options: MockResultSourceOptions) {
    this.balance = options.initialBalance;
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
    const grid = scenarios[scenario];
    const outcome = evaluateSpin(grid, request.bet);
    this.balance += outcome.totalWin - request.bet;
    return { steps: buildSteps(grid, outcome), totalWin: outcome.totalWin, balance: this.balance };
  }

  private nextScenario(): ScenarioName {
    const fromPlaylist = playlist[this.roundCount % playlist.length] ?? 'nowin';
    this.roundCount += 1;
    return this.options.scenario ?? fromPlaylist;
  }
}

/** The script of a base game round: stop the reels, show the wins if any, show the total. */
function buildSteps(grid: SymbolGrid, outcome: SpinOutcome): StandardStep[] {
  const steps: StandardStep[] = [{ type: 'reveal', grid }];
  if (outcome.wins.length > 0) {
    steps.push({ type: 'wins', wins: outcome.wins, amount: outcome.totalWin });
  }
  steps.push({ type: 'totalWin', amount: outcome.totalWin });
  return steps;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
