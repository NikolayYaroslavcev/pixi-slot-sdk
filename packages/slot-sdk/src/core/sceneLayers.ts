import { Container } from 'pixi.js';

// A type alias rather than an interface, so `Object.values` below knows the values are containers.
/**
 * Top-level containers of the scene, from back to front.
 * Each part of a game adds its objects to its own layer, so draw order never depends
 * on which code ran first.
 */
export type SceneLayers = {
  readonly background: Container;
  /** Character and environment. */
  readonly scene: Container;
  readonly reels: Container;
  readonly winOverlay: Container;
  readonly hud: Container;
  readonly popups: Container;
  readonly debug: Container;
};

/** Creates the layers and adds them to `stage` in back-to-front order. */
export function createSceneLayers(stage: Container): SceneLayers {
  // Object keys keep insertion order, so this literal is the single source of the draw order.
  const layers: SceneLayers = {
    background: new Container({ label: 'background' }),
    scene: new Container({ label: 'scene' }),
    reels: new Container({ label: 'reels' }),
    winOverlay: new Container({ label: 'winOverlay' }),
    hud: new Container({ label: 'hud' }),
    popups: new Container({ label: 'popups' }),
    debug: new Container({ label: 'debug' }),
  };
  stage.addChild(...Object.values<Container>(layers));
  return layers;
}
