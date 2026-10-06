import type { GameConfig } from 'slot-sdk';

export const gameConfig: GameConfig = {
  initialBalance: 100_000,
  initialBet: 100,
  backgroundColor: '#062033',
  loadingScreen: {
    logo: 'logo',
    barColor: '#3ee6c4',
    textColor: '#e8fbff',
  },
  // Short holds, as in the reference games: a win reads in about a second.
  presentation: { winsMs: 1400, totalWinMs: 900 },
};

/** The mock game server used until a real one exists. */
export const mockConfig = {
  /** Pretend network time, so the reels spin a little before the result is known. */
  latencyMs: 250,
};
