import type { RoundStep } from '../math/round';

/**
 * Plays one step on screen and resolves when the step is over.
 * `skip` is aborted when the player asks to skip the step: the handler then jumps
 * to the end state of the step right away instead of animating it.
 */
export type StepHandler<Step extends RoundStep> = (step: Step, skip: AbortSignal) => Promise<void>;

/** The part of `RoundPlayer` that features see: they add handlers for their own step types. */
export interface StepRegistry {
  register<Step extends RoundStep>(type: Step['type'], handler: StepHandler<Step>): void;
}

/** Plays a round script: finds the handler of each step by its `type` and waits for it. */
export class RoundPlayer implements StepRegistry {
  // Handlers of different step types take different step shapes, so the map stores them
  // under the widest common type. `register` and `handlerFor` keep the types matched by `type`.
  private readonly handlers = new Map<string, StepHandler<never>>();
  /** Skip signal of the step on screen, null between rounds. */
  private currentStep: AbortController | null = null;

  get isPlaying(): boolean {
    return this.currentStep !== null;
  }

  register<Step extends RoundStep>(type: Step['type'], handler: StepHandler<Step>): void {
    if (this.handlers.has(type)) {
      throw new Error(`RoundPlayer: a handler for step "${type}" is already registered`);
    }
    this.handlers.set(type, handler);
  }

  /**
   * Plays the steps one after another. Every step type is checked before the first one
   * starts, so a script with an unknown step fails without showing half a round.
   * Rejects with the error of a failed handler; the later steps are not played.
   */
  async play(steps: readonly RoundStep[]): Promise<void> {
    if (this.isPlaying) {
      throw new Error('RoundPlayer: a round is already playing');
    }
    const handlers = steps.map((step) => this.handlerFor(step));
    try {
      for (const [index, step] of steps.entries()) {
        this.currentStep = new AbortController();
        await handlers[index]?.(step, this.currentStep.signal);
      }
    } finally {
      this.currentStep = null;
    }
  }

  /** Asks the step on screen to finish now. The next steps play as usual. */
  skip(): void {
    this.currentStep?.abort();
  }

  private handlerFor(step: RoundStep): StepHandler<RoundStep> {
    const handler = this.handlers.get(step.type);
    if (!handler) {
      throw new Error(
        `RoundPlayer: no handler for step "${step.type}". Register one in a feature with context.steps.register()`,
      );
    }
    return handler as StepHandler<RoundStep>;
  }
}
