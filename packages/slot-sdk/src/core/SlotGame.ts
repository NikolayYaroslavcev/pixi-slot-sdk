import { Application } from 'pixi.js';
import { AssetLoader } from '../assets/AssetLoader';
import type { AssetManifest } from '../assets/AssetManifest';
import type { LoadedAssets } from '../assets/LoadedAssets';
import { LoadingScreen } from '../assets/LoadingScreen';
import { loadAssetsWithRetry } from '../assets/loadAssetsWithRetry';
import { World } from '../ecs/World';
import { RoundPlayer } from '../flow/RoundPlayer';
import { StateMachine } from '../flow/StateMachine';
import { LayoutManager } from '../layout/LayoutManager';
import type { ResultSource } from '../math/round';
import { EventBus } from './EventBus';
import type { Feature } from './Feature';
import type { GameConfig } from './GameConfig';
import type { GameContext } from './GameContext';
import type { GameEvents } from './GameEvents';
import { GameModel } from './GameModel';
import { createSceneLayers, type SceneLayers } from './sceneLayers';
import { configureTicker } from './ticker';

export interface SlotGameOptions {
  config: GameConfig;
  assets: AssetManifest;
  resultSource: ResultSource;
  /** Installed in this order, after assets have loaded and before the first frame. */
  features?: Feature[];
}

/**
 * Assembles the application. The whole start-up order is `start()`, read it top to bottom.
 * Create it with `createSlotGame`, which checks the options first.
 */
export class SlotGame {
  private started = false;

  constructor(private readonly options: SlotGameOptions) {}

  async start(): Promise<void> {
    if (this.started) {
      throw new Error('SlotGame: start() has already been called');
    }
    this.started = true;
    const { config, features = [] } = this.options;

    const app = await createApplication(config);
    const layers = createSceneLayers(app.stage);
    const loadingScreen = new LoadingScreen(app, config.loadingScreen, config.backgroundColor);
    app.stage.addChild(loadingScreen.view);
    const loader = new AssetLoader(this.options.assets, app.renderer);
    const assets = await loadAssetsWithRetry(loader, loadingScreen);

    const world = new World();
    const stateMachine = new StateMachine();
    const context = this.createContext(app, layers, world, assets);
    for (const feature of features) {
      feature.install(context);
    }

    startFrameLoop(app, world, stateMachine);
    await loadingScreen.hide();
  }

  private createContext(
    app: Application,
    layers: SceneLayers,
    world: World,
    assets: LoadedAssets,
  ): GameContext {
    const { config, resultSource } = this.options;
    const events = new EventBus<GameEvents>();
    return {
      app,
      layers,
      world,
      events,
      model: new GameModel(events, { balance: config.initialBalance, bet: config.initialBet }),
      layout: new LayoutManager(app.renderer),
      config,
      resultSource,
      assets,
      // Features see the round player only as a registry: playing a round is the core's job.
      steps: new RoundPlayer(),
    };
  }
}

/** Creates the Pixi application and adds its canvas to the page. Its ticker is not running yet. */
async function createApplication(config: GameConfig): Promise<Application> {
  const app = new Application();
  // autoStart: false keeps frames from running until assets are loaded and features installed.
  await app.init({ background: config.backgroundColor, resizeTo: window, autoStart: false });
  document.body.appendChild(app.canvas);
  return app;
}

/** Updates the world and the current state every frame, then starts the ticker. */
function startFrameLoop(app: Application, world: World, stateMachine: StateMachine): void {
  app.ticker.add((ticker) => {
    world.update(ticker.deltaMS);
    stateMachine.update(ticker.deltaMS);
  });
  // Set up only now: returning to the tab during loading must not start the ticker early.
  configureTicker(app.ticker);
  app.start();
}
