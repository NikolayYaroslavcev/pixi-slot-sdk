import { createSlotGame } from 'slot-sdk';
import { assets } from './assets';
import { gameConfig, mockConfig } from './config/game.config';
import { layout } from './layout';
import { tentacleGrab } from './features/tentacleGrab/tentacleGrab';
import { MockResultSource } from './mock/MockResultSource';
import { scenarioFromAddress } from './mock/scenarios';
import { reels } from './scene/reels';
import { scenery } from './scene/scenery';

const field = reels();

await createSlotGame({
  config: gameConfig,
  assets,
  layout,
  resultSource: new MockResultSource({
    initialBalance: gameConfig.initialBalance,
    latencyMs: mockConfig.latencyMs,
    scenario: scenarioFromAddress(window.location.search),
    seed: Date.now(),
  }),
  features: [scenery(), field, tentacleGrab(field)],
}).start();
