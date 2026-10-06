/** The reels as the round flow sees them. `ReelMotionSystem` is the SDK implementation. */
export interface ReelSpinner {
  readonly isSpinning: boolean;
  start(): void;
  /** Lands the reels on `columns`, one array of symbol ids per reel. Resolves when all are at rest. */
  stop(columns: readonly (readonly string[])[]): Promise<void>;
  /** Lands the reels as soon as possible, on the target given to `stop`. */
  hurry(): void;
  /** Lands the reels quickly on the field they showed before the spin. */
  cancel(): Promise<void>;
}
