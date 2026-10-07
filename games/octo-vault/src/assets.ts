import type { AssetManifest } from 'slot-sdk';
import { captainAlias, captainPictures } from './config/character.config';
import type { SymbolId } from './config/symbols';

/** Every resource of the game. Files live in `public/assets/`. */
export const assets = {
  preload: [{ alias: 'logo', src: 'assets/logo.webp' }],
  game: [
    { alias: 'background', src: 'assets/scene/pirate-cove.webp' },
    { alias: 'lightRays', src: 'assets/scene/light-rays.svg' },
    { alias: 'mote', src: 'assets/scene/mote.svg' },
    { alias: 'spark', src: 'assets/fx/spark.svg' },
    { alias: 'coin', src: 'assets/fx/coin.svg' },
    // Lettered plaques, drawn by scripts/make-titles.mjs.
    { alias: 'bigWinTitle', src: 'assets/wins/big-win.svg' },
    { alias: 'megaWinTitle', src: 'assets/wins/mega-win.svg' },
    { alias: 'freeSpinsTitle', src: 'assets/wins/free-spins.svg' },
    { alias: 'freeSpinsWonTitle', src: 'assets/wins/free-spins-won.svg' },
    { alias: 'reelFrame', src: 'assets/scene/reel-frame.svg' },
    // The octopus captain: the v3 layers, cleaned by scripts/clean-captain.mjs.
    ...captainPictures.map((picture) => ({
      alias: captainAlias(picture),
      src: `assets/captain/${picture}.png`,
    })),
    // HUD and popup art: plates stretch in their middle, so one file serves any width.
    { alias: 'spinSkin', src: 'assets/hud/spin.svg' },
    { alias: 'spinBusySkin', src: 'assets/hud/spin-stop.svg' },
    { alias: 'roundSkin', src: 'assets/hud/round.svg' },
    { alias: 'buySkin', src: 'assets/hud/pill-gold.svg' },
    // Drawn at the button's own size, so it never stretches; denser for sharp edges.
    { alias: 'bonusSkin', src: 'assets/hud/pill-red.svg', resolution: 2 },
    { alias: 'darkPillSkin', src: 'assets/hud/pill-wood.svg' },
    { alias: 'valuePanelSkin', src: 'assets/hud/value-panel.svg' },
    { alias: 'popupSkin', src: 'assets/hud/popup.svg' },
    { alias: 'spinIcon', src: 'assets/hud/icon-spin.svg' },
    { alias: 'stopIcon', src: 'assets/hud/icon-stop.svg' },
    { alias: 'skipIcon', src: 'assets/hud/icon-skip.svg' },
    { alias: 'infoIcon', src: 'assets/hud/icon-info.svg' },
    { alias: 'soundOnIcon', src: 'assets/hud/icon-sound-on.svg' },
    { alias: 'soundOffIcon', src: 'assets/hud/icon-sound-off.svg' },
    // Synthesized by scripts/make-sounds.mjs. The alias is the name the sound feature plays.
    { alias: 'music', src: 'assets/sfx/music.wav' },
    { alias: 'click', src: 'assets/sfx/click.wav' },
    { alias: 'spinStart', src: 'assets/sfx/spin-start.wav' },
    { alias: 'reelStop', src: 'assets/sfx/reel-stop.wav' },
    { alias: 'scatterLand', src: 'assets/sfx/scatter-land.wav' },
    { alias: 'anticipation', src: 'assets/sfx/anticipation.wav' },
    { alias: 'tentacle', src: 'assets/sfx/tentacle.wav' },
    { alias: 'multiplier', src: 'assets/sfx/multiplier.wav' },
    { alias: 'win', src: 'assets/sfx/win.wav' },
    { alias: 'bigWin', src: 'assets/sfx/big-win.wav' },
    { alias: 'freeSpins', src: 'assets/sfx/free-spins.wav' },
    { alias: 'titleFont', src: 'assets/fonts/LilitaOne-Regular.ttf', family: 'Lilita One' },
  ],
  // Drawn by scripts/make-symbols.mjs. Each symbol is a square tile, so it fills its cell.
  symbols: {
    jack: { src: 'assets/symbols/symbol_j.svg' },
    queen: { src: 'assets/symbols/symbol_q.svg' },
    king: { src: 'assets/symbols/symbol_k.svg' },
    ace: { src: 'assets/symbols/symbol_a.svg' },
    rum: { src: 'assets/symbols/rum_bottle.svg' },
    anchor: { src: 'assets/symbols/anchor.svg' },
    map: { src: 'assets/symbols/treasure_map.svg' },
    compass: { src: 'assets/symbols/compass.svg' },
    octopus: { src: 'assets/symbols/wild_kraken.svg' },
    chest: { src: 'assets/symbols/treasure_chest.svg' },
  },
} satisfies AssetManifest<SymbolId>;
