import { createSlotGame } from 'slot-sdk';
import { assets } from './assets';
import { gameConfig, mockConfig } from './config/game.config';
import { layout } from './layout';
import { MockResultSource } from './mock/MockResultSource';
import { scenarioFromAddress } from './mock/scenarios';
import { reels } from './scene/reels';
import { scenery } from './scene/scenery';

await createSlotGame({
  config: gameConfig,
  assets,
  layout,
  resultSource: new MockResultSource({
    initialBalance: gameConfig.initialBalance,
    latencyMs: mockConfig.latencyMs,
    scenario: scenarioFromAddress(window.location.search),
  }),
  features: [scenery(), reels()],
}).start();
