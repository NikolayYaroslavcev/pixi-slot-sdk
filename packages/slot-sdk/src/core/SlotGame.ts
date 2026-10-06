import { Application, Container } from 'pixi.js';
import { AssetLoader } from '../assets/AssetLoader';
import type { AssetManifest } from '../assets/AssetManifest';
import { LoadingScreen } from '../assets/LoadingScreen';
import { loadAssetsWithRetry } from '../assets/loadAssetsWithRetry';
import { World } from '../ecs/World';
import { RoundPlayer } from '../flow/RoundPlayer';
import { StateMachine } from '../flow/StateMachine';
import type { LayoutConfig } from '../layout/LayoutConfig';
import { LayoutDebug, isLayoutDebugEnabled } from '../layout/LayoutDebug';
import { LayoutManager } from '../layout/LayoutManager';
import { connectLayoutToPage, screenResolution } from '../layout/viewport';
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
  layout: LayoutConfig;
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
    const { layers, layout } = createScene(app, this.options.layout);
    const loadingScreen = new LoadingScreen(app, config.loadingScreen, config.backgroundColor);
    app.stage.addChild(loadingScreen.view);
    const loader = new AssetLoader(this.options.assets, app.renderer);
    const assets = await loadAssetsWithRetry(loader, loadingScreen);

    const world = new World();
    const stateMachine = new StateMachine();
    const context = this.createContext({ app, layers, layout, world, assets });
    for (const feature of features) {
      feature.install(context);
    }

    startFrameLoop(app, world, stateMachine);
    await loadingScreen.hide();
  }

  private createContext(
    parts: Pick<GameContext, 'app' | 'layers' | 'layout' | 'world' | 'assets'>,
  ): GameContext {
    const { config, resultSource } = this.options;
    const events = new EventBus<GameEvents>();
    return {
      ...parts,
      events,
      model: new GameModel(events, { balance: config.initialBalance, bet: config.initialBet }),
      config,
      resultSource,
      // Features see the round player only as a registry: playing a round is the core's job.
      steps: new RoundPlayer(),
    };
  }
}

/**
 * Creates the Pixi application and adds its canvas to the page. Its ticker is not running yet.
 * The canvas takes the size of `<body>`, which the page stretches to the visible viewport.
 */
async function createApplication(config: GameConfig): Promise<Application> {
  const app = new Application();
  await app.init({
    background: config.backgroundColor,
    resizeTo: document.body,
    resolution: screenResolution(),
    // Keeps the canvas CSS size equal to the screen while its buffer has `resolution` times more pixels.
    autoDensity: true,
    // Keeps frames from running until assets are loaded and features installed.
    autoStart: false,
  });
  document.body.appendChild(app.canvas);
  return app;
}

/**
 * Builds the scene tree `stage → designRoot → layers` and keeps it fitted to the page.
 * The loading screen is added to the stage later, above the design root.
 */
function createScene(
  app: Application,
  layoutConfig: LayoutConfig,
): { layers: SceneLayers; layout: LayoutManager } {
  const designRoot = new Container({ label: 'designRoot' });
  app.stage.addChild(designRoot);
  const layers = createSceneLayers(designRoot);
  const layout = new LayoutManager(designRoot, layoutConfig);
  connectLayoutToPage(app, document.body, layout);
  if (isLayoutDebugEnabled(window.location.search)) {
    const layoutDebug = new LayoutDebug(layers.debug, layout);
    app.ticker.add(() => {
      layoutDebug.draw();
    });
  }
  return { layers, layout };
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
