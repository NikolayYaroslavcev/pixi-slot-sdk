import { Container, Graphics, Sprite, Texture, TextureSource } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import type { LayoutConfig } from './LayoutConfig';
import { LayoutManager } from './LayoutManager';

const noInsets = { top: 0, right: 0, bottom: 0, left: 0 };

const config: LayoutConfig<'title' | 'panel'> = {
  landscape: {
    width: 1920,
    height: 1080,
    nodes: {
      title: { x: 960, y: 100 },
      panel: { x: 1500, y: 540, scale: 2, anchor: { x: 0.5, y: 0.5 } },
    },
  },
  portrait: {
    width: 1080,
    height: 1920,
    nodes: {
      title: { x: 540, y: 200, visible: false },
      panel: { x: 540, y: 1400, anchor: { x: 0.5, y: 1 } },
    },
  },
};

function createLayout() {
  const root = new Container();
  const layout = new LayoutManager(root, config);
  const title = new Container();
  const panel = new Container();
  panel.addChild(new Graphics().rect(0, 0, 200, 100).fill('#ffffff'));
  layout.addNode('title', title);
  layout.addNode('panel', panel);
  return { root, layout, title, panel };
}

describe('LayoutManager', () => {
  it('fits the root into a landscape screen and places nodes in design coordinates', () => {
    const { root, layout, title, panel } = createLayout();

    layout.resize({ width: 844, height: 390 }, noInsets);

    expect(layout.variant).toBe(config.landscape);
    expect(root.scale.x).toBeCloseTo(390 / 1080);
    expect(root.x).toBeCloseTo((844 - 1920 * (390 / 1080)) / 2);
    expect(title.position).toMatchObject({ x: 960, y: 100 });
    expect(title.visible).toBe(true);
    expect(panel.scale.x).toBe(2);
    expect(panel.pivot).toMatchObject({ x: 100, y: 50 });
  });

  it('switches to the portrait variant when the screen turns', () => {
    const { root, layout, title, panel } = createLayout();
    layout.resize({ width: 844, height: 390 }, noInsets);

    layout.resize({ width: 390, height: 844 }, noInsets);

    expect(layout.variant).toBe(config.portrait);
    expect(root.scale.x).toBeCloseTo(390 / 1080);
    expect(root.y).toBeCloseTo((844 - 1920 * (390 / 1080)) / 2);
    expect(title.visible).toBe(false);
    expect(panel.position).toMatchObject({ x: 540, y: 1400 });
    expect(panel.scale.x).toBe(1);
    expect(panel.pivot).toMatchObject({ x: 100, y: 100 });
  });

  it('keeps the design area out of the safe-area insets', () => {
    const { root, layout } = createLayout();

    layout.resize({ width: 1920, height: 1080 }, { top: 40, right: 0, bottom: 40, left: 0 });

    expect(root.scale.x).toBeCloseTo(1000 / 1080);
    expect(root.y).toBe(40);
  });

  it('keeps the last layout when the page has no size', () => {
    const { root, layout } = createLayout();
    layout.resize({ width: 1920, height: 1080 }, noInsets);

    layout.resize({ width: 0, height: 0 }, noInsets);

    expect(layout.variant).toBe(config.landscape);
    expect(root.scale.x).toBe(1);
  });

  it('places a node added after the first resize right away', () => {
    const root = new Container();
    const layout = new LayoutManager(root, config);
    layout.resize({ width: 1920, height: 1080 }, noInsets);
    const title = new Container();

    layout.addNode('title', title);

    expect(title.position).toMatchObject({ x: 960, y: 100 });
  });

  it('scales the background to cover the whole screen, outside the design area too', () => {
    const root = new Container();
    const layout = new LayoutManager(root, config);
    const background = new Sprite(
      new Texture({ source: new TextureSource({ width: 1024, height: 1024 }) }),
    );
    root.addChild(background);
    layout.setBackground(background);

    layout.resize({ width: 3440, height: 1440 }, noInsets);

    const bounds = background.getBounds();
    expect(bounds.minX).toBeCloseTo(0);
    expect(bounds.maxX).toBeCloseTo(3440);
    expect(bounds.minY).toBeCloseTo((1440 - 3440) / 2);
    expect(bounds.maxY).toBeCloseTo((1440 + 3440) / 2);
  });

  it('rejects a node that the config does not describe', () => {
    const layout = new LayoutManager(new Container(), config);

    expect(() => {
      layout.addNode('reels', new Container());
    }).toThrow('LayoutManager: node "reels" is not in the layout config');
  });

  it('rejects the same node added twice', () => {
    const { layout } = createLayout();

    expect(() => {
      layout.addNode('title', new Container());
    }).toThrow('LayoutManager: node "title" is already added');
  });
});
