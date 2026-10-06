import { createSlotGame, type ResultSource } from 'slot-sdk';
import { assets } from './assets';
import { gameConfig } from './config/game.config';
import { layout } from './layout';
import { reels } from './scene/reels';
import { scenery } from './scene/scenery';

// Nothing starts a round yet. The mock result source replaces this placeholder.
const resultSource: ResultSource = {
  play: () => Promise.reject(new Error('Rounds are not available yet')),
};

await createSlotGame({
  config: gameConfig,
  assets,
  layout,
  resultSource,
  features: [scenery(), reels()],
}).start();
