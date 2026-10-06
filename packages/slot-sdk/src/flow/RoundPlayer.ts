import type { RoundStep } from '../math/round';

/** Plays one step on screen and resolves when the step is over. */
export type StepHandler<Step extends RoundStep> = (step: Step) => Promise<void>;

/** The part of `RoundPlayer` that features see: they add handlers for their own step types. */
export interface StepRegistry {
  register<Step extends RoundStep>(type: Step['type'], handler: StepHandler<Step>): void;
}

/** Knows which handler plays each step type of a round script. */
export class RoundPlayer implements StepRegistry {
  // Handlers of different step types take different step shapes, so the map stores them
  // under the widest common type. `register` and `handlerFor` keep the types matched by `type`.
  private readonly handlers = new Map<string, StepHandler<never>>();

  register<Step extends RoundStep>(type: Step['type'], handler: StepHandler<Step>): void {
    if (this.handlers.has(type)) {
      throw new Error(`RoundPlayer: a handler for step "${type}" is already registered`);
    }
    this.handlers.set(type, handler);
  }

  handlerFor(step: RoundStep): StepHandler<RoundStep> {
    const handler = this.handlers.get(step.type);
    if (!handler) {
      throw new Error(
        `RoundPlayer: no handler for step "${step.type}". Register one in a feature with context.steps.register()`,
      );
    }
    return handler as StepHandler<RoundStep>;
  }
}
