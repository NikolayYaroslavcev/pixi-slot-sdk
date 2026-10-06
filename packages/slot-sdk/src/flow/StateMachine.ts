/** For each state, the states it may change to. The whole flow is visible in this one table. */
export type Transitions<State extends string> = Readonly<Record<State, readonly State[]>>;

/**
 * Holds the current state and changes it only along the transition table.
 * A change the table does not allow is a bug in the caller, so it throws instead of being ignored.
 */
export class StateMachine<State extends string> {
  private currentState: State;

  /** `onChange` is called after every change with the new state. */
  constructor(
    private readonly transitions: Transitions<State>,
    initial: State,
    private readonly onChange: (state: State) => void,
  ) {
    this.currentState = initial;
  }

  get current(): State {
    return this.currentState;
  }

  changeTo(next: State): void {
    if (!this.transitions[this.currentState].includes(next)) {
      throw new Error(`StateMachine: "${this.currentState}" cannot change to "${next}"`);
    }
    this.currentState = next;
    this.onChange(next);
  }
}
