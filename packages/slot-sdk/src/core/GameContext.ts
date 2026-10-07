import type { Application } from 'pixi.js';
import type { LoadedAssets } from '../assets/LoadedAssets';
import type { GameAudio } from '../audio/GameAudio';
import type { World } from '../ecs/World';
import type { RoundControls } from '../flow/RoundFlow';
import type { HudControls } from '../ui/Hud';
import type { Popup } from '../ui/Popup';
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
  /** The Pixi application: renderer, ticker, stage. */
  readonly app: Application;
  /** Containers in draw order, from `background` to `debug`. */
  readonly layers: SceneLayers;
  /** ECS world of the reels and symbols. A feature adds its components and systems here. */
  readonly world: World;
  /** Typed events between parts that do not know each other, e.g. a reel stop and its sound. */
  readonly events: EventBus<GameEvents>;
  /** Balance, bet and last win. Changes are published as events. */
  readonly model: GameModel;
  /** Places named objects for the current screen. `addNode` gives an object its layout node. */
  readonly layout: LayoutManager;
  /** The config the game passed to `createSlotGame`. */
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
  /** Extra buttons of the game go into the HUD here. */
  readonly hud: HudControls;
  /** One modal dialog for the whole game, e.g. to confirm a purchase. */
  readonly popup: Popup;
  /** Sounds from the manifest, mute and its saved state. */
  readonly audio: GameAudio;
}
