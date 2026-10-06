import type { AssetManifest } from 'slot-sdk';
import type { SymbolId } from './config/symbols';

/** Every resource of the game. Files live in `public/assets/`. */
export const assets = {
  preload: [{ alias: 'logo', src: 'assets/logo.svg' }],
  game: [
    { alias: 'background', src: 'assets/scene/background.svg' },
    { alias: 'lightRays', src: 'assets/scene/light-rays.svg' },
    { alias: 'bubble', src: 'assets/scene/bubble.svg' },
    { alias: 'reelFrame', src: 'assets/scene/reel-frame.svg' },
    { alias: 'titleFont', src: 'assets/fonts/LilitaOne-Regular.ttf', family: 'Lilita One' },
  ],
  // Own vector art (docs/assets.md). Each symbol is a square tile, so it fills its cell.
  symbols: {
    shell: { src: 'assets/symbols/shell.svg' },
    starfish: { src: 'assets/symbols/starfish.svg' },
    seahorse: { src: 'assets/symbols/seahorse.svg' },
    fish: { src: 'assets/symbols/fish.svg' },
    pearl: { src: 'assets/symbols/pearl.svg' },
    anchor: { src: 'assets/symbols/anchor.svg' },
    chest: { src: 'assets/symbols/chest.svg' },
    crown: { src: 'assets/symbols/crown.svg' },
    octopus: { src: 'assets/symbols/octopus.svg' },
    key: { src: 'assets/symbols/key.svg' },
  },
} satisfies AssetManifest<SymbolId>;
