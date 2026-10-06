import { describe, expect, it } from 'vitest';
import { findLayoutProblems, type LayoutConfig } from './LayoutConfig';

function createConfig(): LayoutConfig {
  return {
    landscape: { width: 1920, height: 1080, nodes: { logo: { x: 960, y: 100 } } },
    portrait: { width: 1080, height: 1920, nodes: { logo: { x: 540, y: 200 } } },
  };
}

describe('findLayoutProblems', () => {
  it('accepts a valid config', () => {
    expect(findLayoutProblems(createConfig())).toEqual([]);
  });

  it('rejects a design area without size', () => {
    const config = createConfig();
    config.portrait.width = 0;

    expect(findLayoutProblems(config)).toEqual([
      'layout.portrait must have a positive width and height, got 0 × 1920',
    ]);
  });

  it('names a node that only one variant places', () => {
    const config = createConfig();
    config.landscape.nodes.reels = { x: 960, y: 540 };
    config.portrait.nodes.hud = { x: 540, y: 1700 };

    expect(findLayoutProblems(config)).toEqual([
      'layout.portrait.nodes is missing "reels"',
      'layout.landscape.nodes is missing "hud"',
    ]);
  });
});
