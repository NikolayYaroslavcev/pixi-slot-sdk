/** Events of Octo Vault on top of the SDK ones: features tell each other through the event bus. */
declare module 'slot-sdk' {
  interface GameEvents {
    /** A free spins series started (true) or the game is back to base spins (false). */
    freeSpinsActive: boolean;
    /** A tentacle of the Grab starts reaching for a cell. */
    tentacleThrown: undefined;
    /** A tentacle has turned its cell into a Wild with this multiplier. */
    multiplierLanded: { value: number };
    /** A reel keeps spinning in suspense after two Scatters, under a light. */
    reelAnticipated: { reelIndex: number };
  }
}

export {};
