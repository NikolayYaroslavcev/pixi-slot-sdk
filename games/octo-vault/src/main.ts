import { createSlotGame } from 'slot-sdk';
import { assets } from './assets';
import { gameConfig, mockConfig } from './config/game.config';
import { layout } from './layout';
import { anticipation } from './features/anticipation/anticipation';
import { bonusBuy } from './features/bonusBuy/bonusBuy';
import { character } from './features/character/character';
import { freeSpins } from './features/freeSpins/freeSpins';
import { rules } from './features/rules/rules';
import { sound } from './features/sound/sound';
import { tentacleGrab } from './features/tentacleGrab/tentacleGrab';
import { MockResultSource } from './mock/MockResultSource';
import { scenarioFromAddress } from './mock/scenarios';
import { freshSeed, seedFromAddress } from './mock/seed';
import { reels } from './scene/reels';
import { scenery } from './scene/scenery';

const field = reels();
const captain = character(field);
const seed = seedFromAddress(window.location.search) ?? freshSeed();
// The seed in the console reproduces this session with `?seed=`.
console.info(`Pirate's Fortune mock seed: ${String(seed)}`);

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
  features: [
    scenery(),
    field,
    captain,
    tentacleGrab(field, captain),
    anticipation(field),
    freeSpins(field),
    bonusBuy(),
    rules(),
    sound(field),
  ],
}).start();
