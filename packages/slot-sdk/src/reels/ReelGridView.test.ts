import { Sprite, Texture } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import { LoadedAssets } from '../assets/LoadedAssets';
import { World } from '../ecs/World';
import { ReelGrid } from './ReelGrid';
import { ReelGridView } from './ReelGridView';

// Textures without a renderer: enough to tell which symbol a sprite shows.
const textures = new Map([
  ['a', new Texture()],
  ['b', new Texture()],
]);
const options = { cellWidth: 100, cellHeight: 100, gap: 10, padding: 20, panelColor: '#000000' };

function createView(): { grid: ReelGrid<'a' | 'b'>; view: ReelGridView } {
  const world = new World();
  const grid = new ReelGrid<'a' | 'b'>(world, { reelCount: 2, rowCount: 2 }, [
    ['a', 'b'],
    ['b', 'a'],
  ]);
  const view = new ReelGridView(world, new LoadedAssets(textures), grid.size, options);
  return { grid, view };
}

function spriteAt(view: ReelGridView, x: number, y: number): Sprite | undefined {
  const sprites = view.container.getChildByLabel('symbols')?.children ?? [];
  return sprites.find(
    (child): child is Sprite => child.x === x && child.y === y && child instanceof Sprite,
  );
}

describe('ReelGridView', () => {
  it('draws a sprite per cell right away, centered in its cell', () => {
    const { view } = createView();

    expect(spriteAt(view, 50, 50)?.texture).toBe(textures.get('a'));
    expect(spriteAt(view, 160, 50)?.texture).toBe(textures.get('b'));
    expect(spriteAt(view, 160, 160)?.texture).toBe(textures.get('a'));
    expect(view.container.getChildByLabel('symbols')?.children).toHaveLength(4);
  });

  it('keeps fixed bounds of panel size', () => {
    const { view } = createView();

    expect(view.container.boundsArea).toMatchObject({ width: 250, height: 250 });
  });

  it('swaps the texture when the symbol changes', () => {
    const { grid, view } = createView();

    grid.setSymbol({ reelIndex: 0, rowIndex: 0 }, 'b');
    view.update();

    expect(spriteAt(view, 50, 50)?.texture).toBe(textures.get('b'));
  });

  it('removes the sprite of a replaced symbol and draws the new one', () => {
    const { grid, view } = createView();
    const old = spriteAt(view, 50, 160);

    grid.replaceSymbol({ reelIndex: 0, rowIndex: 1 }, 'a');
    view.update();

    expect(old?.destroyed).toBe(true);
    expect(spriteAt(view, 50, 160)?.texture).toBe(textures.get('a'));
    expect(view.container.getChildByLabel('symbols')?.children).toHaveLength(4);
  });
});
