import type { AssetManifest } from 'slot-sdk';
import type { SymbolId } from './config/symbols';

/**
 * Every resource of the game. Files live in `public/assets/`.
 * Symbols start as colored placeholders; replace one with `{ src: 'assets/symbols/seven.svg' }`
 * once its art exists. Sounds, fonts and HUD skins go into `game`.
 */
export const assets = {
  preload: [{ alias: 'logo', src: 'assets/logo.svg' }],
  game: [],
  symbols: {
    cherry: { color: '#d94a56', label: 'CHERRY' },
    lemon: { color: '#e0c341', label: 'LEMON' },
    bell: { color: '#4a90d9', label: 'BELL' },
    seven: { color: '#9b59d0', label: '7' },
  },
} satisfies AssetManifest<SymbolId>;
