import type { Application } from 'pixi.js';
import type { LoadedAssets } from '../assets/LoadedAssets';
import type { World } from '../ecs/World';
import type { RoundControls } from '../flow/RoundFlow';
import type { StepRegistry } from '../flow/RoundPlayer';
import type { WinControls } from '../flow/winSteps';
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
  /** Resources loaded from the manifest before the features were installed. */
  readonly assets: LoadedAssets;
  readonly resultSource: ResultSource;
  /** Handlers of round steps. A feature registers the steps its mechanic adds. */
  readonly steps: StepRegistry;
  /** The round flow. The game connects its reels here. */
  readonly round: RoundControls;
  /** The win presentation. The game connects the field that shows wins here. */
  readonly wins: WinControls;
}
