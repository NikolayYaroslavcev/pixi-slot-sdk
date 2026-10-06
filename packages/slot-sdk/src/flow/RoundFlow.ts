import type { EventBus } from '../core/EventBus';
import type { GameEvents } from '../core/GameEvents';
import type { GameModel } from '../core/GameModel';
import { isMinorUnits } from '../math/money';
import type { ResultSource, RevealStep, RoundResult } from '../math/round';
import type { ReelSpinner } from './ReelSpinner';
import type { RoundPlayer } from './RoundPlayer';
import { StateMachine, type Transitions } from './StateMachine';

/**
 * What the player may do right now. A new mechanic adds a step, never a state.
 * - `idle`: Spin and the bet are available.
 * - `spinning`: the reels spin until the first `reveal` lands them. Stop hurries them.
 * - `presenting`: the rest of the script plays. Stop skips the step on screen.
 */
export type RoundState = 'idle' | 'spinning' | 'presenting';

const roundTransitions: Transitions<RoundState> = {
  idle: ['spinning'],
  // Back to idle straight from spinning when the round fails or its script has no reveal.
  spinning: ['presenting', 'idle'],
  presenting: ['idle'],
};

/** The part of the round flow that features see. */
export interface RoundControls {
  /** Connects the reels that rounds spin and `reveal` steps stop. Called once by the game. */
  useReels(reels: ReelSpinner): void;
}

export interface RoundFlowDependencies {
  events: EventBus<GameEvents>;
  model: GameModel;
  resultSource: ResultSource;
  player: RoundPlayer;
}

/**
 * One round from Spin to idle: takes the bet, asks the result source for the round,
 * plays its script and settles the balance. Registers the `reveal` step, because stopping
 * the reels is what ends the `spinning` state.
 */
export class RoundFlow implements RoundControls {
  private readonly machine: StateMachine<RoundState>;
  private reels: ReelSpinner | null = null;

  constructor(private readonly dependencies: RoundFlowDependencies) {
    const { events, player } = dependencies;
    this.machine = new StateMachine(roundTransitions, 'idle', (state) => {
      events.emit('roundStateChanged', state);
    });
    player.register<RevealStep>('reveal', (step, skip) => this.reveal(step, skip));
  }

  get state(): RoundState {
    return this.machine.current;
  }

  /** True when Spin would start a round now: nothing is playing and the balance covers the bet. */
  get canSpin(): boolean {
    const { model } = this.dependencies;
    return this.state === 'idle' && model.bet <= model.balance;
  }

  useReels(reels: ReelSpinner): void {
    if (this.reels) {
      throw new Error('RoundFlow: reels are already connected');
    }
    this.reels = reels;
  }

  /**
   * Plays one round if `canSpin`, otherwise does nothing. Resolves back in `idle`.
   * Never rejects: a failed round returns to `idle` and emits `roundFailed`.
   */
  async spin(): Promise<void> {
    if (!this.canSpin) {
      return;
    }
    const reels = this.requireReels();
    const { model, resultSource } = this.dependencies;
    const { bet } = model;
    const balanceBefore = model.balance;
    model.setBalance(balanceBefore - bet);
    model.setLastWin(0);
    this.machine.changeTo('spinning');
    reels.start();
    let result: RoundResult;
    try {
      result = checkResult(await resultSource.play({ bet }));
    } catch (error) {
      await this.fail(error, { balance: balanceBefore, betReturned: true });
      return;
    }
    await this.present(result);
  }

  /** Stop button: hurries the reels while spinning, skips the step on screen while presenting. */
  stop(): void {
    if (this.state === 'spinning') {
      this.reels?.hurry();
      return;
    }
    if (this.state === 'presenting') {
      this.dependencies.player.skip();
    }
  }

  private async present(result: RoundResult): Promise<void> {
    const { model, player } = this.dependencies;
    try {
      await player.play(result.steps);
    } catch (error) {
      // The source has already settled the round, so its balance is the true one.
      await this.fail(error, { balance: result.balance, betReturned: false });
      return;
    }
    model.setLastWin(result.totalWin);
    model.setBalance(result.balance);
    this.machine.changeTo('idle');
  }

  private async reveal(step: RevealStep, skip: AbortSignal): Promise<void> {
    const reels = this.requireReels();
    // The first reveal finds the reels already spinning since Spin; later ones start them.
    if (!reels.isSpinning) {
      reels.start();
    }
    const landing = reels.stop(step.grid);
    if (skip.aborted) {
      reels.hurry();
    }
    skip.addEventListener(
      'abort',
      () => {
        reels.hurry();
      },
      { once: true },
    );
    await landing;
    if (this.state === 'spinning') {
      this.machine.changeTo('presenting');
    }
  }

  private async fail(
    error: unknown,
    outcome: { balance: number; betReturned: boolean },
  ): Promise<void> {
    console.error('RoundFlow: the round failed', error);
    await this.reels?.cancel();
    this.dependencies.model.setBalance(outcome.balance);
    this.machine.changeTo('idle');
    this.dependencies.events.emit('roundFailed', { betReturned: outcome.betReturned });
  }

  private requireReels(): ReelSpinner {
    if (!this.reels) {
      throw new Error(
        'RoundFlow: no reels. Connect them in a feature with context.round.useReels()',
      );
    }
    return this.reels;
  }
}

/** A source is outside the client's control, so its answer is checked before anything plays. */
function checkResult(result: RoundResult): RoundResult {
  if (
    !Array.isArray(result.steps) ||
    !isMinorUnits(result.totalWin) ||
    !isMinorUnits(result.balance)
  ) {
    throw new Error('RoundFlow: the result source returned an invalid round result');
  }
  return result;
}
