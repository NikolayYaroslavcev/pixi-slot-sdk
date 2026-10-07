import { createSlotGame } from 'slot-sdk';
import { assets } from './assets';
import { gameConfig, mockConfig } from './config/game.config';
import { layout } from './layout';
import { MockResultSource } from './mock/MockResultSource';
import { reels } from './reels';

await createSlotGame({
  config: gameConfig,
  assets,
  layout,
  resultSource: new MockResultSource({
    initialBalance: gameConfig.initialBalance,
    latencyMs: mockConfig.latencyMs,
    seed: Date.now(),
  }),
  // A new mechanic is one more feature here: see `Feature` in the SDK.
  features: [reels()],
}).start();
