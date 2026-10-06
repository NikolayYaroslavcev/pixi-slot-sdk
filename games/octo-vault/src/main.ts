import { createSlotGame, type ResultSource } from 'slot-sdk';
import { gameConfig } from './config/game.config';
import { coreDemo } from './scene/coreDemo';

// Nothing starts a round yet. The mock result source replaces this placeholder.
const resultSource: ResultSource = {
  play: () => Promise.reject(new Error('Rounds are not available yet')),
};

await createSlotGame({
  config: gameConfig,
  resultSource,
  features: [coreDemo()],
}).start();
