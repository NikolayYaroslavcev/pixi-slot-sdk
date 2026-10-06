import { Application } from 'pixi.js';
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
import { createSceneLayers } from './sceneLayers';
import { configureTicker } from './ticker';

export interface SlotGameOptions {
  config: GameConfig;
  resultSource: ResultSource;
  /** Installed in this order, before the first frame. */
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
    const { config, resultSource, features = [] } = this.options;

    const app = await createApplication(config);
    const layers = createSceneLayers(app.stage);
    const world = new World();
    const stateMachine = new StateMachine();
    const roundPlayer = new RoundPlayer();
    const layout = new LayoutManager(app.renderer);
    const events = new EventBus<GameEvents>();
    const model = new GameModel(events, { balance: config.initialBalance, bet: config.initialBet });
    const context: GameContext = {
      app,
      layers,
      world,
      events,
      model,
      layout,
      config,
      resultSource,
      steps: roundPlayer,
    };

    for (const feature of features) {
      feature.install(context);
    }

    startFrameLoop(app, world, stateMachine);
  }
}

/** Creates the Pixi application and adds its canvas to the page. Its ticker is not running yet. */
async function createApplication(config: GameConfig): Promise<Application> {
  const app = new Application();
  // autoStart: false keeps frames from running until every feature is installed.
  await app.init({ background: config.backgroundColor, resizeTo: window, autoStart: false });
  document.body.appendChild(app.canvas);
  configureTicker(app.ticker);
  return app;
}

/** Updates the world and the current state every frame, then starts rendering. */
function startFrameLoop(app: Application, world: World, stateMachine: StateMachine): void {
  app.ticker.add((ticker) => {
    world.update(ticker.deltaMS);
    stateMachine.update(ticker.deltaMS);
  });
  app.start();
}
