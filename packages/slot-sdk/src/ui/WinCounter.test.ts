import { BitmapFont, DOMAdapter, Ticker, type ICanvas } from 'pixi.js';
import { describe, expect, it, vi } from 'vitest';
import { WinCounter } from './WinCounter';

// Text is never measured here, but Pixi asks for a canvas when it builds a style. Node has none.
DOMAdapter.set({
  ...DOMAdapter.get(),
  createCanvas: () => ({ getContext: () => null }) as unknown as ICanvas,
});
// Drawing the counter's bitmap font needs a canvas too; the tests only read the text.
vi.spyOn(BitmapFont, 'install').mockImplementation(() => undefined);

const style = { fontFamily: 'Arial', fontSize: 40, color: '#ffffff', outlineColor: '#000000' };

function createCounter() {
  const ticker = new Ticker();
  ticker.autoStart = false;
  ticker.lastTime = 0;
  // Frames of 50 ms: one long frame is capped by the ticker's minFPS.
  const advance = (ms: number) => {
    for (let elapsed = 0; elapsed < ms; elapsed += 50) {
      ticker.update(ticker.lastTime + 50);
    }
  };
  return { ticker, advance, counter: new WinCounter(ticker, style) };
}

describe('WinCounter', () => {
  it('grows to the amount instead of jumping to it', () => {
    const { advance, counter } = createCounter();

    counter.countUp(10_000, 1000);
    expect(counter.view.text).toBe('0.00');
    advance(500);

    expect(counter.value).toBeGreaterThan(0);
    expect(counter.value).toBeLessThan(10_000);
    advance(500);
    expect(counter.view.text).toBe('100.00');
  });

  it('jumps to the final amount on stop and leaves the ticker', () => {
    const { ticker, advance, counter } = createCounter();
    counter.countUp(2550, 1000);
    advance(100);

    counter.stop();

    expect(counter.view.text).toBe('25.50');
    expect(ticker.count).toBe(0);
  });
});
