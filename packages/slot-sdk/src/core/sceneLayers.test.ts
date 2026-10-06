import { Container } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import { createSceneLayers } from './sceneLayers';

describe('createSceneLayers', () => {
  it('adds the layers to the stage from back to front', () => {
    const stage = new Container();

    createSceneLayers(stage);

    expect(stage.children.map((layer) => layer.label)).toEqual([
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
