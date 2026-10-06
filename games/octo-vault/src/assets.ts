import type { AssetManifest } from 'slot-sdk';

/** Every resource of the game. Files live in `public/assets/`. */
export const assets = {
  preload: [{ alias: 'logo', src: 'assets/logo.svg' }],
  game: [{ alias: 'titleFont', src: 'assets/fonts/LilitaOne-Regular.ttf', family: 'Lilita One' }],
  // Placeholder art until the final symbols are drawn. Lower symbols are cool, higher ones warm.
  symbols: {
    shell: { color: '#3d8fb8', label: 'Shell' },
    starfish: { color: '#4a7fd1', label: 'Starfish' },
    seahorse: { color: '#2fa58f', label: 'Seahorse' },
    fish: { color: '#5aa7d6', label: 'Fish' },
    pearl: { color: '#c77dd6', label: 'Pearl' },
    anchor: { color: '#d6894a', label: 'Anchor' },
    chest: { color: '#c9a23a', label: 'Chest' },
    crown: { color: '#e0573f', label: 'Crown' },
    wild: { color: '#8e3fd6', label: 'WILD' },
    scatter: { color: '#e8c547', label: 'KEY' },
  },
} satisfies AssetManifest;
