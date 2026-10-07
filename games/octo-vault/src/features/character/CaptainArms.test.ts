import { Container, Ticker } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import { captainArmLook } from '../../config/character.config';
import { CaptainArms } from './CaptainArms';

function setUp(): { ticker: Ticker; arms: CaptainArms; parts: Container[]; layer: Container } {
  const ticker = new Ticker();
  const layer = new Container();
  const body = new Container();
  const parts = [new Container(), new Container()];
  const field = { container: new Container(), cellCenter: () => ({ x: 400, y: 200 }) };
  const sources = parts.map((part) => ({ part, body, from: { x: 10, y: 10 } }));
  const look = { ...captainArmLook, cellWidth: 170 };
  return { ticker, arms: new CaptainArms(ticker, layer, field, sources, look), parts, layer };
}

/** Runs the ticker for `ms` in 20 ms frames, as the game would, letting awaits in between run. */
async function run(ticker: Ticker, ms: number): Promise<void> {
  let time = Math.max(ticker.lastTime, 0);
  for (let elapsed = 0; elapsed < ms; elapsed += 20) {
    time += 20;
    ticker.update(time);
    await Promise.resolve();
  }
}

const cell = { reelIndex: 2, rowIndex: 1 };
const { reachMs, curlMs, holdMs, retractMs } = captainArmLook;

describe('CaptainArms', () => {
  it('tucks the tentacle away while its arm is out and brings it back after', async () => {
    const { ticker, arms, parts } = setUp();

    const reached = arms.reach(cell, new AbortController().signal);
    expect(parts[0]?.visible).toBe(false);
    await run(ticker, reachMs + 40);
    await reached;
    await run(ticker, curlMs + holdMs + retractMs + 200);

    expect(parts[0]?.visible).toBe(true);
  });

  it('pulls an arm back quickly when asked, e.g. as the wins come', async () => {
    const { ticker, arms, parts } = setUp();
    void arms.reach(cell, new AbortController().signal);
    await run(ticker, reachMs + 40);

    arms.pullBack();
    await run(ticker, captainArmLook.pullBackMs + 60);

    expect(parts[0]?.visible).toBe(true);
  });

  it('lands at once when the player skips', async () => {
    const { arms } = setUp();
    const skip = new AbortController();
    skip.abort();

    await expect(arms.reach(cell, skip.signal)).resolves.toBeUndefined();
  });

  it('sends its tentacles out in turn', () => {
    const { arms, parts } = setUp();
    const skip = new AbortController().signal;

    void arms.reach(cell, skip);
    void arms.reach(cell, skip);

    expect(parts.map((part) => part.visible)).toEqual([false, false]);
  });

  it('leaves the ticker, removes its drawings and shows the tentacles on destroy', () => {
    const { ticker, arms, parts, layer } = setUp();
    const before = ticker.count;
    void arms.reach(cell, new AbortController().signal);

    arms.destroy();
    arms.destroy();

    expect(ticker.count).toBeLessThan(before);
    expect(layer.children).toHaveLength(0);
    expect(parts.every((part) => part.visible)).toBe(true);
  });
});
