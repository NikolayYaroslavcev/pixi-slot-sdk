import type { GameConfig } from 'slot-sdk';

/** A dialog over the game, e.g. to confirm buying free spins. */
const popupStyle: GameConfig['popup'] = {
  width: 940,
  // The skin's carved rim is about 65 wide: content starts well inside the dark field.
  padding: 100,
  panelColor: '#2a1206',
  panelSkin: 'popupSkin',
  dimColor: '#0d0602',
  dimAlpha: 0.74,
  titleColor: '#ffd45a',
  titleFontSize: 66,
  messageColor: '#fff0c8',
  messageFontSize: 40,
  button: {
    width: 300,
    height: 120,
    fontSize: 46,
    fontFamily: 'Lilita One',
    color: '#f2c24a',
    skin: 'darkPillSkin',
    textColor: '#fff0c8',
    hitPadding: 8,
  },
  // The main choice, e.g. BUY, is gold; Cancel stays dark wood.
  mainButton: { skin: 'buySkin', textColor: '#3a1606' },
};

export const gameConfig: GameConfig = {
  initialBalance: 100_000,
  initialBet: 100,
  betLevels: [10, 20, 50, 100, 200, 500, 1000],
  backgroundColor: '#1a0c05',
  loadingScreen: {
    logo: 'logo',
    barColor: '#f2c24a',
    textColor: '#fff0c8',
  },
  wins: {
    // As in the reference games: all wins read in about a second, then each line briefly.
    // Between rounds the last spin's wins come back one by one, `idleWinMs` each, until the next Spin.
    timing: {
      allWinsMs: 1500,
      countUpMs: 900,
      eachWinMs: 1100,
      totalWinMs: 400,
      fadeMs: 180,
      idleWinMs: 1500,
    },
    // Thresholds in bets. Mega Win is louder in every way: title, color, particles, time.
    bigWins: [
      {
        title: 'BIG WIN',
        titleArt: 'bigWinTitle',
        minBets: 10,
        countUpMs: 2600,
        holdMs: 1200,
        color: '#ffd45a',
        titleScale: 0.9,
        particlesPerSecond: 45,
      },
      {
        title: 'MEGA WIN',
        titleArt: 'megaWinTitle',
        minBets: 25,
        countUpMs: 4200,
        holdMs: 1500,
        color: '#ff5a3c',
        titleScale: 0.95,
        particlesPerSecond: 110,
      },
    ],
    style: {
      fontFamily: 'Lilita One',
      // Bright against the dark wood, distinct from each other for neighbouring lines.
      lineColors: ['#ffd45a', '#ff5a3c', '#5fd8e8', '#7cf07a', '#ff9a2e'],
      lineWidth: 10,
      textColor: '#ffffff',
      outlineColor: '#2a1206',
      counterFontSize: 150,
      amountFontSize: 80,
      overlayColor: '#0d0602',
      overlayAlpha: 0.78,
      bigWinTitleSize: 170,
      bigWinCounterSize: 140,
      // Gold coins tumbling out of the win; white keeps the coin's own colors.
      particles: {
        texture: 'coin',
        spin: 9,
        colors: ['#ffffff', '#ffffff', '#ffe9a8'],
        radius: 22,
        lifeMs: 1800,
        speed: 1500,
        gravity: 1500,
      },
    },
  },
  // Sizes are design pixels. Round buttons are 120 across so they stay near 44 CSS px on a
  // 320 px wide phone; `hitPadding` widens the touch area beyond the art.
  hud: {
    fontFamily: 'Lilita One',
    textColor: '#fff0c8',
    captionColor: '#f6d76a',
    buttonColor: '#f2c24a',
    buttonTextColor: '#fff0c8',
    captionFontSize: 26,
    valueFontSize: 46,
    messageFontSize: 36,
    spinButton: {
      radius: 120,
      fontSize: 52,
      skin: 'spinSkin',
      hitPadding: 12,
      // Spin is gold; while the reels run it turns red, so Stop and Skip read as another role.
      looks: {
        spin: { skin: 'spinSkin', icon: 'spinIcon' },
        stop: { skin: 'spinBusySkin', icon: 'stopIcon' },
        skip: { skin: 'spinBusySkin', icon: 'skipIcon' },
      },
    },
    betButtons: { size: 120, fontSize: 64, offset: 230, skin: 'roundSkin', hitPadding: 10 },
    // The price sits on the dark plate of the skin, larger than the label above it.
    extraButtons: {
      width: 300,
      height: 132,
      fontSize: 30,
      caption: { fontSize: 46, color: '#fff3b0' },
      // Bonus Buy is red, as in the art direction, so it never reads as a second Spin.
      skin: 'bonusSkin',
      textColor: '#ffe08a',
      hitPadding: 8,
    },
    iconButtons: { radius: 56, skin: 'roundSkin', hitPadding: 14 },
    valuePanel: { skin: 'valuePanelSkin', width: 330, height: 124 },
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
