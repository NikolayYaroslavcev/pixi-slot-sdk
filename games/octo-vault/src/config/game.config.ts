import type { GameConfig } from 'slot-sdk';

export const gameConfig: GameConfig = {
  initialBalance: 100_000,
  initialBet: 100,
  betLevels: [10, 20, 50, 100, 200, 500, 1000],
  backgroundColor: '#062033',
  loadingScreen: {
    logo: 'logo',
    barColor: '#3ee6c4',
    textColor: '#e8fbff',
  },
  // Short holds, as in the reference games: a win reads in about a second.
  presentation: { winsMs: 1400, totalWinMs: 900 },
  // Sizes are design pixels. Bet buttons are 120 so they stay near 44 CSS px on a 390 px wide phone.
  hud: {
    fontFamily: 'Lilita One',
    textColor: '#e8fbff',
    captionColor: '#7fc8d8',
    buttonColor: '#3ee6c4',
    buttonTextColor: '#062033',
    captionFontSize: 28,
    valueFontSize: 48,
    messageFontSize: 38,
    spinButton: { radius: 110, fontSize: 52 },
    betButtons: { size: 120, fontSize: 64, offset: 200 },
    texts: {
      balance: 'BALANCE',
      bet: 'BET',
      win: 'WIN',
      spin: 'SPIN',
      stop: 'STOP',
      skip: 'SKIP',
      idle: 'Press SPIN to play',
      spinning: 'Good luck!',
      wins: 'Lines pay',
      betReturned: 'Connection lost. Your bet is returned.',
      roundError: 'Something went wrong. The round is settled.',
      notEnoughBalance: 'Not enough balance. Lower the bet.',
    },
  },
};

/** The mock game server used until a real one exists. */
export const mockConfig = {
  /** Pretend network time, so the reels spin a little before the result is known. */
  latencyMs: 250,
};
