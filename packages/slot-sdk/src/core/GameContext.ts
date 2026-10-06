import type { Application } from 'pixi.js';
import type { World } from '../ecs/World';
import type { StepRegistry } from '../flow/RoundPlayer';
import type { LayoutManager } from '../layout/LayoutManager';
import type { ResultSource } from '../math/round';
import type { EventBus } from './EventBus';
import type { GameConfig } from './GameConfig';
import type { GameEvents } from './GameEvents';
import type { GameModel } from './GameModel';
import type { SceneLayers } from './sceneLayers';

/**
 * Everything a part of the game may depend on. `SlotGame` builds it once and passes it
 * to every feature explicitly. It is a plain object: there is no lookup by name
 * and no global access.
 */
export interface GameContext {
  readonly app: Application;
  readonly layers: SceneLayers;
  readonly world: World;
  readonly events: EventBus<GameEvents>;
  readonly model: GameModel;
  readonly layout: LayoutManager;
  readonly config: GameConfig;
  readonly resultSource: ResultSource;
  /** Handlers of round steps. A feature registers the steps its mechanic adds. */
  readonly steps: StepRegistry;
}
