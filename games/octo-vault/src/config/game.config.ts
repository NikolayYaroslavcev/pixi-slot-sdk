import type { GameConfig } from 'slot-sdk';

/** A dialog over the game, e.g. to confirm buying free spins. */
const popupStyle: GameConfig['popup'] = {
  width: 860,
  padding: 56,
  panelColor: '#0a2c44',
  dimColor: '#020c14',
  dimAlpha: 0.7,
  titleColor: '#3ee6c4',
  titleFontSize: 64,
  messageColor: '#e8fbff',
  messageFontSize: 44,
  button: {
    width: 300,
    height: 120,
    fontSize: 48,
    fontFamily: 'Lilita One',
    color: '#3ee6c4',
    textColor: '#062033',
  },
};

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
  wins: {
    // As in the reference games: all wins read in about a second, then each line briefly.
    timing: { allWinsMs: 1500, countUpMs: 900, eachWinMs: 1100, totalWinMs: 400, fadeMs: 180 },
    // Thresholds in bets. Mega Win is louder in every way: title, color, particles, time.
    bigWins: [
      {
        title: 'BIG WIN',
        minBets: 10,
        countUpMs: 2600,
        holdMs: 1200,
        color: '#ffd23f',
        titleScale: 1,
        particlesPerSecond: 45,
      },
      {
        title: 'MEGA WIN',
        minBets: 25,
        countUpMs: 4200,
        holdMs: 1500,
        color: '#ff5fd2',
        titleScale: 1.25,
        particlesPerSecond: 110,
      },
    ],
    style: {
      fontFamily: 'Lilita One',
      // Bright neon against the deep blue panel, distinct from each other for neighbouring lines.
      lineColors: ['#3ee6c4', '#ffd23f', '#ff5fd2', '#7aa8ff', '#ff8a3d'],
      lineWidth: 10,
      textColor: '#ffffff',
      outlineColor: '#062033',
      counterFontSize: 150,
      amountFontSize: 80,
      overlayColor: '#020c14',
      overlayAlpha: 0.78,
      bigWinTitleSize: 170,
      bigWinCounterSize: 140,
      particles: {
        colors: ['#ffd23f', '#3ee6c4', '#ffffff', '#ff5fd2'],
        radius: 9,
        lifeMs: 1800,
        speed: 1500,
        gravity: 1500,
      },
    },
  },
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
    extraButtons: { width: 300, height: 120, fontSize: 40 },
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
  popup: popupStyle,
};

/** The mock game server used until a real one exists. */
export const mockConfig = {
  /** Pretend network time, so the reels spin a little before the result is known. */
  latencyMs: 250,
};
