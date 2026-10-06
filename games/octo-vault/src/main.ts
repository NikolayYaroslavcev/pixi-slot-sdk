import { createSlotGame } from 'slot-sdk';
import { assets } from './assets';
import { gameConfig, mockConfig } from './config/game.config';
import { layout } from './layout';
import { bonusBuy } from './features/bonusBuy/bonusBuy';
import { freeSpins } from './features/freeSpins/freeSpins';
import { tentacleGrab } from './features/tentacleGrab/tentacleGrab';
import { MockResultSource } from './mock/MockResultSource';
import { scenarioFromAddress } from './mock/scenarios';
import { freshSeed, seedFromAddress } from './mock/seed';
import { reels } from './scene/reels';
import { scenery } from './scene/scenery';

const field = reels();
const seed = seedFromAddress(window.location.search) ?? freshSeed();
// The seed in the console reproduces this session with `?seed=`.
console.info(`Octo Vault mock seed: ${String(seed)}`);

await createSlotGame({
  config: gameConfig,
  assets,
  layout,
  resultSource: new MockResultSource({
    initialBalance: gameConfig.initialBalance,
    latencyMs: mockConfig.latencyMs,
    scenario: scenarioFromAddress(window.location.search),
    seed,
  }),
  features: [scenery(), field, tentacleGrab(field), freeSpins(field), bonusBuy()],
}).start();
