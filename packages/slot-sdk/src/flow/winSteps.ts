import type { EventBus } from '../core/EventBus';
import type { GameEvents } from '../core/GameEvents';
import type { GameModel } from '../core/GameModel';
import type { TotalWinStep, Win, WinsStep } from '../math/round';
import { bigWinTier, type BigWinTier } from '../wins/bigWinTier';
import { IdleWinReplay } from './IdleWinReplay';
import type { StepRegistry } from './RoundPlayer';

/** How long each part of a win presentation lasts, in milliseconds. Set by the game. */
export interface WinTiming {
  /** All wins of a `wins` step together, with the counter growing to their sum. */
  allWinsMs: number;
  /** Part of `allWinsMs` the counter takes to grow. */
  countUpMs: number;
  /** Each win on its own after that, with its line and amount. */
  eachWinMs: number;
  /** The `totalWin` step of a round that won less than a Big Win. */
  totalWinMs: number;
  /** Lines and the Big Win overlay fade in and out this fast. */
  fadeMs: number;
  /**
   * Between rounds each win of the last spin comes back for this long, in turn, until the next
   * Spin. Without it the field stays clean between rounds.
   */
  idleWinMs?: number;
}

/** What the `wins` step draws on the field. The SDK's `FieldWinView` is one. */
export interface WinField {
  /** Every win at once: their cells lit, their lines, a counter growing to `amount` in `countUpMs`. */
  showAll(wins: readonly Win[], amount: number, countUpMs: number): void;
  /** One win alone: its cells lit, its line and its amount. */
  showOne(win: Win): void;
  /** Removes everything the field shows for wins and stops its animations at once. */
  clear(): void;
}

/** The overlay of a Big Win. The SDK's `BigWinOverlay` is one. */
export interface BigWinScreen {
  /** Appears in `fadeMs` and counts up to `amount` in the tier's `countUpMs`. */
  show(tier: BigWinTier, amount: number, fadeMs: number): void;
  /** Starts to disappear; `hide` ends it. */
  fadeOut(fadeMs: number): void;
  /** Removes the overlay and stops its animations at once. */
  hide(): void;
}

/** The part of the win presentation that features see. */
export interface WinControls {
  /** Connects the field that `wins` steps draw on. Called once by the game, with its reels. */
  useField(field: WinField): void;
}

/** Waits `ms` on the game clock, or less if `skip` is aborted. */
export type Pause = (ms: number, skip: AbortSignal) => Promise<void>;

export interface WinStepsDependencies {
  events: EventBus<GameEvents>;
  model: GameModel;
  pause: Pause;
  timing: WinTiming;
  bigWins: readonly BigWinTier[];
  bigWinScreen: BigWinScreen;
}

/**
 * Plays the SDK steps `wins` and `totalWin`. It only decides the order and the timing:
 * what wins and by how much comes from the step, how it looks is up to the field and the overlay.
 *
 * Skip ends the whole presentation of a win, not only the step on screen: a `totalWin` step
 * right after a skipped `wins` step only settles the amount. One press, one clean field.
 */
export class WinSteps implements WinControls {
  private field: WinField | null = null;
  /** Set by a skipped `wins` step, read and reset by the next `totalWin`. */
  private winsSkipped = false;

  constructor(
    registry: StepRegistry,
    private readonly dependencies: WinStepsDependencies,
  ) {
    registry.register<WinsStep>('wins', (step, skip) => this.showWins(step, skip));
    registry.register<TotalWinStep>('totalWin', (step, skip) => this.showTotal(step, skip));
    const { events, pause, timing } = dependencies;
    // The replay runs on the events alone; nothing calls it.
    if (timing.idleWinMs !== undefined) {
      new IdleWinReplay(events, pause, timing.idleWinMs, () => this.field);
    }
  }

  useField(field: WinField): void {
    if (this.field) {
      throw new Error('WinSteps: the field is already connected');
    }
    this.field = field;
  }

  /** All wins with the counter, then each win alone. A single win needs no second pass. */
  private async showWins(step: WinsStep, skip: AbortSignal): Promise<void> {
    const field = this.requireField();
    const { events, pause, timing } = this.dependencies;
    this.winsSkipped = false;
    events.emit('winsShown', { wins: step.wins, amount: step.amount });
    try {
      field.showAll(step.wins, step.amount, timing.countUpMs);
      await pause(timing.allWinsMs, skip);
      if (step.wins.length > 1) {
        await this.showEachWin(field, step.wins, skip);
      }
    } finally {
      field.clear();
      this.winsSkipped = skip.aborted;
    }
  }

  private async showEachWin(
    field: WinField,
    wins: readonly Win[],
    skip: AbortSignal,
  ): Promise<void> {
    for (const win of wins) {
      if (skip.aborted) {
        return;
      }
      field.showOne(win);
      await this.dependencies.pause(this.dependencies.timing.eachWinMs, skip);
    }
  }

  private async showTotal(step: TotalWinStep, skip: AbortSignal): Promise<void> {
    const { model, pause, timing, bigWins } = this.dependencies;
    const skipped = this.winsSkipped || skip.aborted;
    this.winsSkipped = false;
    model.setLastWin(step.amount);
    // A round without a win has nothing to hold on screen, a skipped one nothing left to show.
    if (step.amount === 0 || skipped) {
      return;
    }
    const tier = bigWinTier(step.amount, model.bet, bigWins);
    if (!tier) {
      await pause(timing.totalWinMs, skip);
      return;
    }
    await this.showBigWin(tier, step.amount, skip);
  }

  private async showBigWin(tier: BigWinTier, amount: number, skip: AbortSignal): Promise<void> {
    const { bigWinScreen, pause, timing, events, bigWins } = this.dependencies;
    try {
      bigWinScreen.show(tier, amount, timing.fadeMs);
      events.emit('bigWinShown', { tierIndex: bigWins.indexOf(tier), title: tier.title });
      await pause(tier.countUpMs + tier.holdMs, skip);
      if (!skip.aborted) {
        bigWinScreen.fadeOut(timing.fadeMs);
        await pause(timing.fadeMs, skip);
      }
    } finally {
      bigWinScreen.hide();
      events.emit('bigWinEnded', undefined);
    }
  }

  private requireField(): WinField {
    if (!this.field) {
      throw new Error('WinSteps: no field. Connect it in a feature with context.wins.useField()');
    }
    return this.field;
  }
}
