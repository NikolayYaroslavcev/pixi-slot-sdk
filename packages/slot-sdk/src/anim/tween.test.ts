import { Ticker } from 'pixi.js';
import { describe, expect, it, vi } from 'vitest';
import { easeInQuad } from './easing';
import { tween, wait } from './tween';

// A ticker that never runs on its own: each `advance` is one frame of the given length.
function createManualTicker(): { ticker: Ticker; advance: (ms: number) => void } {
  const ticker = new Ticker();
  ticker.autoStart = false;
  ticker.lastTime = 0;
  return {
    ticker,
    advance: (ms) => {
      ticker.update(ticker.lastTime + ms);
    },
  };
}

describe('tween', () => {
  it('moves the property linearly by default and resolves at the end', async () => {
    const { ticker, advance } = createManualTicker();
    const target = { x: 0 };
    const onDone = vi.fn();
    void tween(ticker, target, { x: 100 }, { duration: 100 }).then(onDone);

    advance(50);
    expect(target.x).toBe(50);

    advance(50);
    expect(target.x).toBe(100);
    await Promise.resolve();
    expect(onDone).toHaveBeenCalledOnce();
  });

  it('applies the easing to progress', () => {
    const { ticker, advance } = createManualTicker();
    const target = { x: 0 };
    void tween(ticker, target, { x: 100 }, { duration: 100, easing: easeInQuad });

    advance(50);

    expect(target.x).toBe(25);
  });

  it('animates several properties from their current values', () => {
    const { ticker, advance } = createManualTicker();
    const target = { x: 10, alpha: 1 };
    void tween(ticker, target, { x: 20, alpha: 0 }, { duration: 100 });

    advance(25);

    expect(target).toEqual({ x: 12.5, alpha: 0.75 });
  });

  it('never overshoots the end value on a long frame', () => {
    const { ticker, advance } = createManualTicker();
    const target = { x: 0 };
    void tween(ticker, target, { x: 100 }, { duration: 30 });

    advance(80);

    expect(target.x).toBe(100);
  });

  it('jumps to the end values and resolves on finish', async () => {
    const { ticker, advance } = createManualTicker();
    const target = { x: 0 };
    const animation = tween(ticker, target, { x: 100 }, { duration: 1_000 });
    advance(100);

    animation.finish();
    await animation;

    expect(target.x).toBe(100);
    expect(ticker.count).toBe(0);
  });

  it('ignores ticks after finish', () => {
    const { ticker, advance } = createManualTicker();
    const target = { x: 0 };
    tween(ticker, target, { x: 100 }, { duration: 1_000 }).finish();
    target.x = 7;

    advance(500);

    expect(target.x).toBe(7);
  });

  it('ends immediately when the duration is zero', async () => {
    const { ticker } = createManualTicker();
    const target = { x: 0 };

    await tween(ticker, target, { x: 100 }, { duration: 0 });

    expect(target.x).toBe(100);
  });
});

describe('wait', () => {
  it('resolves only after the given ticker time has passed', async () => {
    const { ticker, advance } = createManualTicker();
    const onDone = vi.fn();
    void wait(ticker, 100).then(onDone);

    advance(60);
    await Promise.resolve();
    expect(onDone).not.toHaveBeenCalled();

    advance(40);
    await Promise.resolve();
    expect(onDone).toHaveBeenCalledOnce();
  });

  it('can be ended early with finish', async () => {
    const { ticker } = createManualTicker();
    const pause = wait(ticker, 10_000);

    pause.finish();

    await expect(Promise.resolve(pause)).resolves.toBeUndefined();
  });
});
