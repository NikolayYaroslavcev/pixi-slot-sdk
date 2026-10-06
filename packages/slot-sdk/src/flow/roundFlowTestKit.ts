import { vi } from 'vitest';
import { EventBus } from '../core/EventBus';
import type { GameEvents } from '../core/GameEvents';
import { GameModel } from '../core/GameModel';
import type { ResultSource, RoundResult, StandardStep, Win } from '../math/round';
import type { BigWinTier } from '../wins/bigWinTier';
import type { ReelSpinner } from './ReelSpinner';
import { RoundFlow } from './RoundFlow';
import { RoundPlayer } from './RoundPlayer';
import { WinSteps, type BigWinScreen, type Pause, type WinField, type WinTiming } from './winSteps';

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

/** A field that records what it was asked to show. `active` is true while anything is on it. */
export class FakeWinField implements WinField {
  readonly calls: string[] = [];
  active = false;

  showAll(wins: readonly Win[], amount: number, countUpMs: number): void {
    this.calls.push(`all ${String(wins.length)} ${String(amount)} in ${String(countUpMs)}`);
    this.active = true;
  }

  showOne(win: Win): void {
    this.calls.push(`one ${String(win.amount)}`);
  }

  clear(): void {
    this.calls.push('clear');
    this.active = false;
  }
}

/** A Big Win overlay that records what it was asked to show. */
export class FakeBigWinScreen implements BigWinScreen {
  readonly calls: string[] = [];
  active = false;

  show(tier: BigWinTier, amount: number): void {
    this.calls.push(`show ${tier.title} ${String(amount)}`);
    this.active = true;
  }

  fadeOut(): void {
    this.calls.push('fadeOut');
  }

  hide(): void {
    this.calls.push('hide');
    this.active = false;
  }
}

export const testWinTiming: WinTiming = {
  allWinsMs: 1000,
  countUpMs: 600,
  eachWinMs: 700,
  totalWinMs: 500,
  fadeMs: 200,
};

function testTier(title: string, minBets: number): BigWinTier {
  return {
    title,
    minBets,
    countUpMs: 2000,
    holdMs: 1000,
    color: '#ffffff',
    titleScale: 1,
    particlesPerSecond: 10,
  };
}

/** Big Win from 10 bets, Mega Win from 25. */
export const testBigWins: readonly BigWinTier[] = [testTier('BIG', 10), testTier('MEGA', 25)];

/** Win steps on a model with a bet of 100, a fake field and a fake overlay. */
export function createWinSteps(pause: Pause) {
  const events = new EventBus<GameEvents>();
  const model = new GameModel(events, { balance: 1000, bet: 100 });
  const player = new RoundPlayer();
  const field = new FakeWinField();
  const bigWinScreen = new FakeBigWinScreen();
  const wins = new WinSteps(player, {
    events,
    model,
    pause,
    timing: testWinTiming,
    bigWins: testBigWins,
    bigWinScreen,
  });
  wins.useField(field);
  return { events, model, player, field, bigWinScreen, wins };
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
  const wins = new WinSteps(player, {
    events,
    model,
    pause,
    timing: testWinTiming,
    bigWins: testBigWins,
    bigWinScreen: new FakeBigWinScreen(),
  });
  wins.useField(new FakeWinField());
  const resultSource = { play: vi.fn(play) };
  const flow = new RoundFlow({ events, model, resultSource, player });
  const reels = new FakeReels();
  flow.useReels(reels);
  const states: string[] = [];
  events.on('roundStateChanged', (state) => states.push(state));
  return { events, model, player, pause, resultSource, flow, reels, states };
}
