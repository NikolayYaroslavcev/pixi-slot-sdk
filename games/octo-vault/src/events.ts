/** Events of Octo Vault on top of the SDK ones: features tell each other through the event bus. */
declare module 'slot-sdk' {
  interface GameEvents {
    /** A free spins series started (true) or the game is back to base spins (false). */
    freeSpinsActive: boolean;
  }
}

export {};
