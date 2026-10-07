import { DOMAdapter, Texture, type ICanvas } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import { motionBlurLevel, MotionBlurTextures } from './motionBlur';

// Node has no 2D canvas: a blurred copy falls back to the symbol itself.
DOMAdapter.set({
  ...DOMAdapter.get(),
  createCanvas: () => ({ getContext: () => null }) as unknown as ICanvas,
});

const options = { fromSpeed: 5, fullSpeed: 25, strength: 40, levels: 2 };

describe('motionBlurLevel', () => {
  it('keeps a slow reel sharp', () => {
    expect(motionBlurLevel(0, options)).toBe(0);
    expect(motionBlurLevel(5, options)).toBe(0);
  });

  it('steps up with speed to the last level at full speed', () => {
    expect(motionBlurLevel(10, options)).toBe(1);
    expect(motionBlurLevel(16, options)).toBe(2);
    expect(motionBlurLevel(60, options)).toBe(2);
  });

  it('blurs the settling bounce like the same speed downward', () => {
    expect(motionBlurLevel(-16, options)).toBe(motionBlurLevel(16, options));
  });
});

describe('MotionBlurTextures', () => {
  it('returns the symbol itself at level 0 and without a canvas', () => {
    const blurred = new MotionBlurTextures(options, 100);
    const texture = new Texture();
    expect(blurred.get(texture, 0)).toBe(texture);
    expect(blurred.get(texture, 2)).toBe(texture);
  });
});
