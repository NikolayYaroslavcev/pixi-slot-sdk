/** One phase of the game, e.g. waiting for Spin. All hooks are optional. */
export interface State {
  enter?(): void;
  exit?(): void;
  update?(deltaMs: number): void;
}

/** Holds the current state, switches states and updates the current one every frame. */
export class StateMachine {
  private current: State | undefined;

  changeTo(next: State): void {
    this.current?.exit?.();
    this.current = next;
    next.enter?.();
  }

  update(deltaMs: number): void {
    this.current?.update?.(deltaMs);
  }
}
