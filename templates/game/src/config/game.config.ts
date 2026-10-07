import type { GameConfig } from 'slot-sdk';

// A system font, so the game needs no font file. Load your own in `assets.ts` and name it here.
const fontFamily = 'Arial';
const accent = '#f2c24a';
const text = '#f4f1e8';
const dark = '#14161f';

export const gameConfig: GameConfig = {
  initialBalance: 100_000,
  initialBet: 100,
  betLevels: [10, 20, 50, 100, 200, 500],
  backgroundColor: dark,
  loadingScreen: { logo: 'logo', barColor: accent, textColor: text },
  wins: {
    timing: { allWinsMs: 1200, countUpMs: 700, eachWinMs: 1000, totalWinMs: 400, fadeMs: 180 },
    bigWins: [
      {
        title: 'BIG WIN',
        minBets: 10,
        countUpMs: 2000,
        holdMs: 1000,
        color: accent,
        titleScale: 1,
        particlesPerSecond: 40,
      },
    ],
    style: {
      fontFamily,
      lineColors: [accent],
      lineWidth: 10,
      textColor: text,
      outlineColor: dark,
      counterFontSize: 120,
      amountFontSize: 64,
      overlayColor: dark,
      overlayAlpha: 0.75,
      bigWinTitleSize: 140,
      bigWinCounterSize: 120,
      particles: { colors: [accent, text], radius: 12, lifeMs: 1600, speed: 1300, gravity: 1500 },
    },
  },
  // Sizes are design pixels. Without skins the buttons are plain shapes in `buttonColor`.
  hud: {
    fontFamily,
    textColor: text,
    captionColor: accent,
    buttonColor: accent,
    buttonTextColor: dark,
    captionFontSize: 26,
    valueFontSize: 44,
    messageFontSize: 34,
    spinButton: { radius: 110, fontSize: 48, hitPadding: 12 },
    betButtons: { size: 96, fontSize: 56, offset: 220, hitPadding: 10 },
    extraButtons: { width: 280, height: 110, fontSize: 32, hitPadding: 8 },
    texts: {
      balance: 'BALANCE',
      bet: 'BET',
      win: 'WIN',
      spin: 'SPIN',
      stop: 'STOP',
      skip: 'SKIP',
      idle: 'Press SPIN to play',
      spinning: 'Good luck!',
      wins: 'Win',
      betReturned: 'Connection lost. Your bet is returned.',
      roundError: 'Something went wrong. The round is settled.',
      notEnoughBalance: 'Not enough balance. Lower the bet.',
    },
  },
  popup: {
    width: 900,
    padding: 64,
    panelColor: '#232838',
    dimColor: dark,
    dimAlpha: 0.7,
    titleColor: accent,
    titleFontSize: 60,
    messageColor: text,
    messageFontSize: 38,
    button: { width: 280, height: 110, fontSize: 40, fontFamily, color: accent, textColor: dark },
  },
};

/** The mock game server used until a real one exists. */
export const mockConfig = {
  /** Pretend network time, so the reels spin a little before the result is known. */
  latencyMs: 250,
};
