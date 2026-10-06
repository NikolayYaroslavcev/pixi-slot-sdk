import { Container } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import { createSceneLayers } from './sceneLayers';

describe('createSceneLayers', () => {
  it('adds the layers to the design root from back to front', () => {
    const designRoot = new Container();

    createSceneLayers(designRoot);

    expect(designRoot.children.map((layer) => layer.label)).toEqual([
      'background',
      'scene',
      'reels',
      'winOverlay',
      'hud',
      'popups',
      'debug',
    ]);
  });
});
