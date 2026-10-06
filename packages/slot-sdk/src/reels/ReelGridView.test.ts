import { BlurFilter, Container, DOMAdapter, Sprite, Texture, type ICanvas } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import { LoadedAssets } from '../assets/LoadedAssets';
import { EventBus } from '../core/EventBus';
import type { GameEvents } from '../core/GameEvents';
import { World } from '../ecs/World';
import { rowCenterY } from './reelGeometry';
import { ReelGrid } from './ReelGrid';
import { ReelGridView } from './ReelGridView';
import { ReelMotionSystem } from './ReelMotionSystem';
import { HighlightSystem } from '../wins/Highlight';

type TestSymbol = 'a' | 'b' | 'c';

// A filter asks a test canvas for WebGL precision once. Node has no canvas: answer "no WebGL".
DOMAdapter.set({
  ...DOMAdapter.get(),
  createCanvas: () => ({ getContext: () => null }) as unknown as ICanvas,
});

// Textures without a renderer: enough to tell which symbol a sprite shows.
const textures = new Map<string, Texture>([
  ['a', new Texture()],
  ['b', new Texture()],
  ['c', new Texture()],
]);
const options = {
  cellWidth: 100,
  cellHeight: 100,
  gap: 10,
  padding: 20,
  panelColor: '#000000',
  motionBlur: { fromSpeed: 5, fullSpeed: 20, strength: 10, quality: 2 },
};
const motion = {
  startSpeed: 4,
  maxSpeed: 20,
  accelerateMs: 100,
  minimumSpinMs: 300,
  decelerateMs: 300,
  bounce: 0.1,
  bounceMs: 100,
  startDelayMs: 0,
  stopDelayMs: 100,
  quickStopDelayMs: 50,
};
const target: TestSymbol[][] = [
  ['c', 'c'],
  ['a', 'b'],
];

function createView() {
  const world = new World();
  const grid = new ReelGrid<TestSymbol>(world, { reelCount: 2, rowCount: 2 }, [
    ['a', 'b'],
    ['b', 'a'],
  ]);
  const strips: TestSymbol[][] = [
    ['a', 'b', 'c'],
    ['c', 'b', 'a'],
  ];
  const system = new ReelMotionSystem(world, grid, strips, motion, new EventBus<GameEvents>());
  const view = new ReelGridView(world, grid, new LoadedAssets(textures), options);
  const frame = (ms: number) => {
    system.update(ms);
    view.update();
  };
  return { world, grid, system, view, frame };
}

function reelSprites(view: ReelGridView, reelIndex: number): Sprite[] {
  const reel = view.container.getChildByLabel(`reel ${String(reelIndex)}`, true);
  return (reel?.children ?? []).filter((child): child is Sprite => child instanceof Sprite);
}

/** Textures of the sprites standing exactly on the visible rows of a reel, top to bottom. */
function visibleTextures(view: ReelGridView, reelIndex: number): (Texture | undefined)[] {
  return [0, 1].map(
    (rowIndex) =>
      reelSprites(view, reelIndex).find((sprite) => sprite.y === rowCenterY(rowIndex, options))
        ?.texture,
  );
}

function reelBlur(view: ReelGridView, reelIndex: number): BlurFilter | undefined {
  const reel = view.container.getChildByLabel(`reel ${String(reelIndex)}`, true);
  const [blur] = reel?.filters ?? [];
  return blur instanceof BlurFilter ? blur : undefined;
}

describe('ReelGridView', () => {
  it('draws the field right away, each symbol centered in its cell', () => {
    const { view } = createView();
    expect(visibleTextures(view, 0)).toEqual([textures.get('a'), textures.get('b')]);
    expect(visibleTextures(view, 1)).toEqual([textures.get('b'), textures.get('a')]);
    expect(reelSprites(view, 1).every((sprite) => sprite.x === 160)).toBe(true);
  });

  it('draws highlighted symbols larger and dimmed ones darker, and restores them', () => {
    const { world, grid, view } = createView();
    const highlight = new HighlightSystem(world, grid, {
      dimBrightness: 0.5,
      fadeMs: 0,
      pulseScale: 0.2,
      pulseMs: 400,
    });
    const spriteAt = (rowIndex: number) =>
      reelSprites(view, 0).find((sprite) => sprite.y === rowCenterY(rowIndex, options));

    highlight.show([{ reelIndex: 0, rowIndex: 0 }]);
    highlight.update(200);
    view.update();

    expect(spriteAt(0)?.width).toBeCloseTo(120);
    expect(spriteAt(0)?.tint).toBe(0xffffff);
    expect(spriteAt(1)?.width).toBe(100);
    expect(spriteAt(1)?.tint).toBe(0x808080);

    highlight.clear();
    view.update();
    expect(spriteAt(0)?.width).toBe(100);
    expect(spriteAt(1)?.tint).toBe(0xffffff);
  });

  it('gives the center of a cell inside the panel', () => {
    const { view } = createView();
    expect(view.cellCenter({ reelIndex: 1, rowIndex: 0 })).toEqual({ x: 180, y: 70 });
  });

  it('keeps fixed bounds of panel size', () => {
    const { view } = createView();
    expect(view.container.boundsArea).toMatchObject({ width: 250, height: 250 });
  });

  it('masks the symbols by the cells area', () => {
    const { view } = createView();
    const symbols = view.container.getChildByLabel('symbols');
    expect(symbols?.mask).toBeInstanceOf(Container);
    expect((symbols?.mask as Container).getLocalBounds()).toMatchObject({
      x: 0,
      y: 0,
      width: 210,
      height: 210,
    });
  });

  it('shows a symbol changed in the grid', () => {
    const { grid, view } = createView();
    grid.setSymbol({ reelIndex: 0, rowIndex: 0 }, 'c');
    view.update();
    expect(visibleTextures(view, 0)[0]).toBe(textures.get('c'));
  });

  it('reuses the same rows + 2 sprites per reel for the whole spin', () => {
    const { system, view, frame } = createView();
    const before = [reelSprites(view, 0), reelSprites(view, 1)];
    expect(before[0]).toHaveLength(4);
    system.start();
    void system.stop(target);
    while (system.isSpinning) {
      frame(16);
      expect(reelSprites(view, 0)).toEqual(before[0]);
      expect(reelSprites(view, 1)).toEqual(before[1]);
    }
    expect(before.flat().some((sprite) => sprite.destroyed)).toBe(false);
  });

  it('after the spin shows the target exactly in the cells', () => {
    const { system, view, frame } = createView();
    system.start();
    void system.stop(target);
    while (system.isSpinning) {
      frame(16);
    }
    expect(visibleTextures(view, 0)).toEqual([textures.get('c'), textures.get('c')]);
    expect(visibleTextures(view, 1)).toEqual([textures.get('a'), textures.get('b')]);
    const rows = reelSprites(view, 0)
      .map((sprite) => sprite.y)
      .sort((a, b) => a - b);
    expect(rows).toEqual([-1, 0, 1, 2].map((row) => rowCenterY(row, options)));
  });

  it('blurs a reel only while it moves fast', () => {
    const { system, view, frame } = createView();
    expect(reelBlur(view, 0)?.enabled).toBe(false);
    system.start();
    void system.stop(target);
    frame(16);
    frame(200);
    frame(16);
    expect(reelBlur(view, 0)?.enabled).toBe(true);
    expect(reelBlur(view, 0)?.strengthY).toBeCloseTo(10);
    // Drawn at half size, the field gets half the blur in screen pixels.
    view.container.scale.set(0.5);
    view.container.updateLocalTransform();
    view.container.worldTransform.copyFrom(view.container.localTransform);
    frame(16);
    expect(reelBlur(view, 0)?.strengthY).toBeCloseTo(5);
    const filter = reelBlur(view, 0);
    while (system.isSpinning) {
      frame(16);
    }
    expect(reelBlur(view, 0)).toBe(filter);
    expect(reelBlur(view, 0)?.enabled).toBe(false);
  });

  it('needs the motion system first', () => {
    const world = new World();
    const grid = new ReelGrid<TestSymbol>(world, { reelCount: 1, rowCount: 1 }, [['a']]);
    expect(() => new ReelGridView(world, grid, new LoadedAssets(textures), options)).toThrow(
      'ReelGridView: reel 0 has no motion, create ReelMotionSystem first',
    );
  });
});
