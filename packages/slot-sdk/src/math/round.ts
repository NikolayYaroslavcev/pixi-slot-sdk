/** What the client asks for when the player starts a round. */
export interface RoundRequest {
  /** Minor units. */
  bet: number;
}

/**
 * One thing the player sees during a round, e.g. reels stopping or a win shown.
 * `type` picks the handler that plays the step. A game adds its own step types
 * by extending this interface.
 */
export interface RoundStep {
  readonly type: string;
}

/** Outcome of a round as a script: the client plays the steps in order and calculates nothing. */
export interface RoundResult {
  steps: RoundStep[];
  /** Minor units. */
  totalWin: number;
  /** Balance after the round, minor units. */
  balance: number;
}

/**
 * Where rounds come from: a mock in development, a game server in production.
 * The client does not change when the source is swapped.
 */
export interface ResultSource {
  play(request: RoundRequest): Promise<RoundResult>;
}
