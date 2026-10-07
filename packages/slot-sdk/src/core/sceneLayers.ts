import { Container } from 'pixi.js';

// A type alias rather than an interface, so `Object.values` below knows the values are containers.
/**
 * Containers of the scene inside the design root, from back to front. They use design coordinates.
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

export function createSceneLayers(designRoot: Container): SceneLayers {
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
  designRoot.addChild(...Object.values<Container>(layers));
  return layers;
}
