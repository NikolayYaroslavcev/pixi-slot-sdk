import type { CellPosition } from '../reels/components';

/** What the client asks for when the player starts a round. */
export interface RoundRequest {
  /** Minor units. */
  bet: number;
}

/**
 * One thing the player sees during a round, e.g. reels stopping or a win shown.
 * `type` picks the handler that plays the step. A game adds its own step types
 * by extending this interface and registering a handler in a `Feature`.
 */
export interface RoundStep {
  readonly type: string;
}

/** Spin the reels and stop them on `grid`. */
export interface RevealStep extends RoundStep {
  readonly type: 'reveal';
  /** Symbol ids the reels stop on, one array per reel from the top. */
  readonly grid: readonly (readonly string[])[];
}

/** One paying combination. A game adds its own details, such as the line or the symbol. */
export interface Win {
  /** Cells that form the combination. */
  readonly cells: readonly CellPosition[];
  /** Minor units. */
  readonly amount: number;
  /**
   * Cells a payline passes through, one per reel, when the win is a line. The client draws
   * the line along them; `cells` may be only its matching part. Absent for a win that is
   * not a line, e.g. scattered symbols: such a win is shown by its cells alone.
   */
  readonly path?: readonly CellPosition[];
  /** A few characters shown before the amount when the win is shown alone, e.g. "×5". */
  readonly caption?: string;
}

/** Show the wins of the field that has just been revealed. */
export interface WinsStep extends RoundStep {
  readonly type: 'wins';
  readonly wins: readonly Win[];
  /** Sum of the wins, minor units. */
  readonly amount: number;
}

/** Show the result of the whole round. Always the last step of a round script. */
export interface TotalWinStep extends RoundStep {
  readonly type: 'totalWin';
  /** Minor units. */
  readonly amount: number;
}

/** Steps every game gets from the SDK, with handlers already registered. */
export type StandardStep = RevealStep | WinsStep | TotalWinStep;

/** Outcome of a round as a script: the client plays the steps in order and calculates nothing. */
export interface RoundResult {
  steps: readonly RoundStep[];
  /** Minor units. */
  totalWin: number;
  /** Balance after the round, minor units. */
  balance: number;
}

/**
 * Where rounds come from: a mock in development, a game server in production.
 * The client does not change when the source is swapped. A source knows nothing about
 * the screen: it only returns data. It rejects when the round could not be played.
 */
export interface ResultSource {
  play(request: RoundRequest): Promise<RoundResult>;
}
