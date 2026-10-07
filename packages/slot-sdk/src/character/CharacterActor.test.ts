import { Container, Texture, Ticker } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import { CharacterActor } from './CharacterActor';
import type { CharacterAnimation } from './characterPose';
import { buildLayeredCharacter } from './layeredCharacter';

type Part = 'body' | 'arm' | 'smile';

const animations: Record<string, CharacterAnimation<Part>> = {
  idle: { durationMs: 1000, pose: (timeMs) => ({ body: { y: -timeMs / 100 } }) },
  cheer: {
    durationMs: 500,
    pose: () => ({ arm: { rotation: 1 }, smile: { alpha: 1 }, body: { scaleY: 2 } }),
  },
};

function createCharacter(): { view: Container; parts: Record<Part, Container> } {
  return buildLayeredCharacter<Part>({
    layers: {
      body: { texture: 'body', pivot: { x: 50, y: 90 } },
      arm: { texture: 'arm', parent: 'body', behind: true, pivot: { x: 60, y: 40 } },
      smile: {
        texture: 'smile',
        parent: 'body',
        pivot: { x: 5, y: 5 },
        position: { x: 50, y: 50 },
        rotation: 0.5,
        mirror: true,
        alpha: 0,
      },
    },
    origin: { x: 50, y: 100 },
    texture: () => Texture.EMPTY,
  });
}

function createActor(ticker = new Ticker()): CharacterActor<Part> {
  const { view, parts } = createCharacter();
  return new CharacterActor({ view, parts, animations, ticker, mixMs: 0 });
}

/** Runs the ticker for `ms` in 20 ms frames: it caps one frame at 100 ms, as in the game. */
function frame(ticker: Ticker, ms: number): void {
  let time = Math.max(ticker.lastTime, 0);
  for (let elapsed = 0; elapsed < ms; elapsed += 20) {
    time += 20;
    ticker.update(time);
  }
}

describe('buildLayeredCharacter', () => {
  it('puts each part on its pivot, so the canvas paints it at rest where it belongs', () => {
    const { parts } = createCharacter();

    expect(parts.arm.pivot).toMatchObject({ x: 60, y: 40 });
    expect(parts.arm.position).toMatchObject({ x: 60, y: 40 });
    expect(parts.smile.alpha).toBe(0);
  });

  it('places a separate image by its pivot in the parent, turned, scaled and mirrored', () => {
    const { parts } = createCharacter();

    expect(parts.smile.pivot).toMatchObject({ x: 5, y: 5 });
    expect(parts.smile.position).toMatchObject({ x: 50, y: 50 });
    expect(parts.smile.rotation).toBe(0.5);
    expect(parts.smile.scale).toMatchObject({ x: -1, y: 1 });
  });

  it('nests parts under their parent, behind its own image when asked', () => {
    const { view, parts } = createCharacter();

    expect(parts.arm.parent).toBe(parts.body);
    expect(parts.body.getChildIndex(parts.arm)).toBe(0);
    expect(parts.body.getChildIndex(parts.smile)).toBe(parts.body.children.length - 1);
    // The origin shift sits inside the view, whose transform the layout owns.
    expect(view.position).toMatchObject({ x: 0, y: 0 });
    expect(parts.body.parent?.position).toMatchObject({ x: -50, y: -100 });
  });

  it('refuses a part listed before its parent', () => {
    expect(() =>
      buildLayeredCharacter<'eye' | 'head'>({
        layers: {
          eye: { parent: 'head', pivot: { x: 0, y: 0 } },
          head: { pivot: { x: 0, y: 0 } },
        },
        origin: { x: 0, y: 0 },
        texture: () => Texture.EMPTY,
      }),
    ).toThrow('"eye" comes before its parent "head"');
  });
});

describe('CharacterActor', () => {
  it('moves the parts by the animation on every frame of the ticker', () => {
    const ticker = new Ticker();
    const actor = createActor(ticker);
    const body = actor.part('body');

    void actor.play('idle', { loop: true });
    frame(ticker, 400);

    expect(actor.current).toBe('idle');
    expect(body.y).toBeCloseTo(90 - 4, 1);
  });

  it('returns every part to rest when another animation leaves it out', () => {
    const ticker = new Ticker();
    const actor = createActor(ticker);
    void actor.play('cheer');
    frame(ticker, 100);
    expect(actor.part('smile').alpha).toBe(1);
    expect(actor.part('body').scale.y).toBe(2);

    void actor.play('idle', { loop: true });
    frame(ticker, 100);

    expect(actor.part('smile').alpha).toBe(0);
    expect(actor.part('arm').rotation).toBe(0);
    expect(actor.part('body').scale.y).toBe(1);
    // A rest pose that is turned and mirrored stays so.
    expect(actor.part('smile').rotation).toBe(0.5);
    expect(actor.part('smile').scale.x).toBe(-1);
  });

  it('puts the parts back at rest on stop', () => {
    const ticker = new Ticker();
    const actor = createActor(ticker);
    void actor.play('cheer');
    frame(ticker, 100);

    actor.stop();

    expect(actor.current).toBeNull();
    expect(actor.part('arm').rotation).toBe(0);
  });

  it('throws for an animation it does not have', () => {
    const actor = createActor();

    expect(() => actor.play('fly')).toThrow('no animation "fly". It has: idle, cheer');
  });

  it('adds one ticker callback, whatever it plays, and takes it away on destroy', async () => {
    const ticker = new Ticker();
    const before = ticker.count;
    const actor = createActor(ticker);
    expect(ticker.count).toBe(before + 1);
    const idle = actor.play('idle', { loop: true });
    for (let round = 0; round < 30; round++) {
      void actor.play('cheer');
      void actor.queue('idle', { loop: true });
      frame(ticker, 50);
    }
    expect(ticker.count).toBe(before + 1);

    actor.destroy();
    actor.destroy();

    await expect(idle).resolves.toBe('interrupted');
    expect(ticker.count).toBe(before);
    expect(actor.view.destroyed).toBe(true);
    expect(() => actor.play('idle')).toThrow('the actor is destroyed');
  });
});
