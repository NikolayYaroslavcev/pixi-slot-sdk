import { vi } from 'vitest';
import { EventBus } from '../core/EventBus';
import type { GameEvents } from '../core/GameEvents';
import { GameModel } from '../core/GameModel';
import type { ResultSource, RoundResult, StandardStep } from '../math/round';
import type { ReelSpinner } from './ReelSpinner';
import { RoundFlow } from './RoundFlow';
import { RoundPlayer } from './RoundPlayer';
import { registerWinSteps, type Pause } from './winSteps';

// Test doubles for the round flow and the HUD presenter. Not used by games.

/** Reels that land when the test says so, or right away with `autoLand`. */
export class FakeReels implements ReelSpinner {
  isSpinning = false;
  autoLand = true;
  hurryCount = 0;
  cancelCount = 0;
  target: readonly (readonly string[])[] | null = null;
  private land: (() => void) | null = null;

  start(): void {
    this.isSpinning = true;
  }

  stop(columns: readonly (readonly string[])[]): Promise<void> {
    this.target = columns;
    const landing = new Promise<void>((resolve) => {
      this.land = () => {
        this.isSpinning = false;
        resolve();
      };
    });
    if (this.autoLand) {
      this.finishLanding();
    }
    return landing;
  }

  hurry(): void {
    this.hurryCount += 1;
  }

  cancel(): Promise<void> {
    this.cancelCount += 1;
    this.isSpinning = false;
    this.finishLanding();
    return Promise.resolve();
  }

  finishLanding(): void {
    this.land?.();
    this.land = null;
  }
}

export const grid = [['a'], ['b']];

const wonSteps: StandardStep[] = [
  { type: 'reveal', grid },
  { type: 'wins', wins: [{ cells: [], amount: 250 }], amount: 250 },
  { type: 'totalWin', amount: 250 },
];

/** A won round as a source would send it after a bet of 100 from a balance of 1000. */
export const wonRound: RoundResult = {
  steps: wonSteps,
  totalWin: 250,
  balance: 1150,
};

/** A round flow on a fresh model (balance 1000, bet 100) with fake reels and an instant pause. */
export function createRoundFlow(play: ResultSource['play'] = () => Promise.resolve(wonRound)) {
  const events = new EventBus<GameEvents>();
  const model = new GameModel(events, { balance: 1000, bet: 100 });
  const player = new RoundPlayer();
  const pause = vi.fn<Pause>(() => Promise.resolve());
  registerWinSteps(player, { events, model, pause, timing: { winsMs: 1000, totalWinMs: 500 } });
  const resultSource = { play: vi.fn(play) };
  const flow = new RoundFlow({ events, model, resultSource, player });
  const reels = new FakeReels();
  flow.useReels(reels);
  const states: string[] = [];
  events.on('roundStateChanged', (state) => states.push(state));
  return { events, model, player, pause, resultSource, flow, reels, states };
}
