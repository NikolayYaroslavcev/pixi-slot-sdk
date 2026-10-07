import { Application, Container, type Ticker } from 'pixi.js';
import { AssetLoader } from '../assets/AssetLoader';
import { GameAudio } from '../audio/GameAudio';
import { unlockAudioOnGesture } from '../audio/unlockAudio';
import type { AssetManifest } from '../assets/AssetManifest';
import { LoadingScreen } from '../assets/LoadingScreen';
import { loadAssetsWithRetry } from '../assets/loadAssetsWithRetry';
import { World } from '../ecs/World';
import { waitUnlessSkipped } from '../anim/tween';
import { RoundPlayer } from '../flow/RoundPlayer';
import { RoundFlow } from '../flow/RoundFlow';
import { WinSteps, type Pause } from '../flow/winSteps';
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
import { Hud } from '../ui/Hud';
import { Popup } from '../ui/Popup';
import { BigWinOverlay } from '../wins/BigWinOverlay';
import { createSceneLayers, type SceneLayers } from './sceneLayers';
import { configureTicker } from './ticker';

/** Everything a game hands to `createSlotGame`. The SDK holds no game data of its own. */
export interface SlotGameOptions {
  /** Money, bets, win presentation and the look of the HUD and popups. */
  config: GameConfig;
  /** Every file to load. The loading screen shows `preload` while `game` loads. */
  assets: AssetManifest;
  /** Where each named object goes, in landscape and in portrait. Must place every HUD node. */
  layout: LayoutConfig;
  /** Where round results come from: the game's mock now, a server client later. */
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

  /**
   * Creates the canvas, shows the loading screen, loads the assets (with Retry on failure),
   * installs the features in order and starts the frame loop. Resolves once the game is
   * playable. Call it once.
   */
  async start(): Promise<void> {
    if (this.started) {
      throw new Error('SlotGame: start() has already been called');
    }
    this.started = true;
    const { config, features = [] } = this.options;

    const app = await createApplication(config);
    // Before loading: the sound library teaches Pixi Assets to load audio files.
    const audio = await createAudio();
    const { layers, layout } = createScene(app, this.options.layout);
    const loadingScreen = new LoadingScreen(app, config.loadingScreen, config.backgroundColor);
    app.stage.addChild(loadingScreen.view);
    const loader = new AssetLoader(this.options.assets, app.renderer);
    const assets = await loadAssetsWithRetry(loader, loadingScreen);

    const world = new World();
    const context = this.createContext({ app, layers, layout, world, assets, audio });
    for (const feature of features) {
      feature.install(context);
    }

    startFrameLoop(app, world);
    await loadingScreen.hide();
  }

  /**
   * Builds the core parts and the context. The HUD gets the whole round flow,
   * features only its controls.
   */
  private createContext(
    parts: Pick<GameContext, 'app' | 'layers' | 'layout' | 'world' | 'assets' | 'audio'>,
  ): GameContext {
    const { config, resultSource } = this.options;
    const events = new EventBus<GameEvents>();
    const model = new GameModel(events, { balance: config.initialBalance, bet: config.initialBet });
    const player = new RoundPlayer();
    const pause = createPause(parts.app.ticker);
    const bigWinScreen = new BigWinOverlay({ ...parts, config });
    const { timing, bigWins } = config.wins;
    const wins = new WinSteps(player, { events, model, pause, timing, bigWins, bigWinScreen });
    const round = new RoundFlow({ events, model, resultSource, player });
    const popup = createPopup(parts, config.popup, events);
    const hudDependencies = { events, model, round, betLevels: config.betLevels };
    const hud = new Hud({ ...parts, popup, events }, hudDependencies, config.hud);
    // Features see the round player only as a registry: playing a round is the core's job.
    return {
      ...parts,
      events,
      model,
      config,
      resultSource,
      steps: player,
      round,
      wins,
      hud,
      popup,
    };
  }
}

/** The game's one popup. Its presses are announced like the HUD's, e.g. for a click sound. */
function createPopup(
  parts: Pick<GameContext, 'app' | 'layers' | 'layout'>,
  style: GameConfig['popup'],
  events: EventBus<GameEvents>,
): Popup {
  const popup = new Popup(parts.layers.popups, parts.layout, parts.app.ticker, style);
  popup.onButtonPress(() => {
    events.emit('buttonPressed', undefined);
  });
  return popup;
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
 * Loads `@pixi/sound` only now, in the browser: it needs `document` the moment it loads,
 * and importing it lazily keeps it out of tests and out of the first chunk.
 */
async function createAudio(): Promise<GameAudio> {
  const { sound } = await import('@pixi/sound');
  // Pausing follows the tab only. Pausing on window blur too could leave the sound off
  // when focus and visibility come back in a different order.
  sound.disableAutoPause = true;
  unlockAudioOnGesture(sound.context.audioContext, window);
  return new GameAudio(sound, document, browserStorage());
}

/** `localStorage`, or nothing when the browser blocks it. */
function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
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

/** Pauses of the round steps run on the game ticker, so they stop with it on a hidden tab. */
function createPause(ticker: Ticker): Pause {
  return (ms, skip) => waitUnlessSkipped(ticker, ms, skip);
}

function startFrameLoop(app: Application, world: World): void {
  app.ticker.add((ticker) => {
    world.update(ticker.deltaMS);
  });
  // Set up only now: returning to the tab during loading must not start the ticker early.
  configureTicker(app.ticker);
  app.start();
}
