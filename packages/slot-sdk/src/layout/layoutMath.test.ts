import { describe, expect, it } from 'vitest';
import { fitContain, fitCover, insetArea, pickVariant, toDesignArea } from './layoutMath';

const landscapeDesign = { width: 1920, height: 1080 };
const portraitDesign = { width: 1080, height: 1920 };

function area(width: number, height: number, x = 0, y = 0) {
  return { x, y, width, height };
}

describe('pickVariant', () => {
  it('picks landscape for a desktop window', () => {
    expect(pickVariant({ width: 1920, height: 1080 })).toBe('landscape');
  });

  it('picks landscape for a phone held sideways', () => {
    expect(pickVariant({ width: 844, height: 390 })).toBe('landscape');
  });

  it('picks portrait for a phone held upright', () => {
    expect(pickVariant({ width: 390, height: 844 })).toBe('portrait');
  });

  it('picks landscape for an ultra-wide window', () => {
    expect(pickVariant({ width: 3440, height: 1440 })).toBe('landscape');
  });

  it('picks portrait for a very tall, narrow window', () => {
    expect(pickVariant({ width: 320, height: 1200 })).toBe('portrait');
  });

  it('picks landscape for a square window', () => {
    expect(pickVariant({ width: 800, height: 800 })).toBe('landscape');
  });
});

describe('fitContain', () => {
  it('keeps scale 1 when the area matches the design', () => {
    expect(fitContain(landscapeDesign, area(1920, 1080))).toEqual({ scale: 1, x: 0, y: 0 });
  });

  it('scales up without offset when the area is a larger copy of the design', () => {
    expect(fitContain(landscapeDesign, area(3840, 2160))).toEqual({ scale: 2, x: 0, y: 0 });
  });

  it('fits a landscape design into a phone held sideways, centered horizontally', () => {
    const fit = fitContain(landscapeDesign, area(844, 390));

    expect(fit.scale).toBeCloseTo(390 / 1080);
    expect(fit.y).toBe(0);
    expect(fit.x).toBeCloseTo((844 - 1920 * (390 / 1080)) / 2); // ≈ 75.33
  });

  it('fits a portrait design into an upright phone, centered vertically', () => {
    const fit = fitContain(portraitDesign, area(390, 844));

    expect(fit.scale).toBeCloseTo(390 / 1080);
    expect(fit.x).toBe(0);
    expect(fit.y).toBeCloseTo((844 - 1920 * (390 / 1080)) / 2); // ≈ 75.33
  });

  it('limits an ultra-wide window by height and centers horizontally', () => {
    const fit = fitContain(landscapeDesign, area(3440, 1440));

    expect(fit.scale).toBeCloseTo(4 / 3);
    expect(fit.x).toBeCloseTo((3440 - 2560) / 2);
    expect(fit.y).toBe(0);
  });

  it('limits a tall window by width and centers vertically', () => {
    const fit = fitContain(landscapeDesign, area(960, 1080));

    expect(fit.scale).toBe(0.5);
    expect(fit.x).toBe(0);
    expect(fit.y).toBe((1080 - 540) / 2);
  });

  it('scales down a design larger than the area and touches only the limiting sides', () => {
    const fit = fitContain(landscapeDesign, area(1000, 700));

    expect(fit.scale).toBeCloseTo(1000 / 1920);
    expect(fit.x).toBeCloseTo(0);
    expect(fit.y).toBeCloseTo((700 - 562.5) / 2); // 1080 × 1000/1920 = 562.5
  });

  it('centers inside an area that is offset by safe-area insets', () => {
    const fit = fitContain(landscapeDesign, area(1920, 1000, 0, 40));

    expect(fit.scale).toBeCloseTo(1000 / 1080);
    expect(fit.y).toBe(40);
    expect(fit.x).toBeCloseTo((1920 - 1920 * (1000 / 1080)) / 2);
  });
});

describe('fitCover', () => {
  const squareBackground = { width: 1024, height: 1024 };

  it('fills a wide area and crops top and bottom equally', () => {
    const fit = fitCover(squareBackground, area(1920, 1080));

    expect(fit.scale).toBe(1920 / 1024);
    expect(fit.x).toBe(0);
    expect(fit.y).toBe((1080 - 1920) / 2);
  });

  it('fills a tall area and crops left and right equally', () => {
    const fit = fitCover(squareBackground, area(390, 844));

    expect(fit.scale).toBe(844 / 1024);
    expect(fit.x).toBe((390 - 844) / 2);
    expect(fit.y).toBe(0);
  });

  it('covers the whole area with no empty strips', () => {
    const target = area(3440, 1440, -100, -50);
    const fit = fitCover(squareBackground, target);

    expect(fit.x).toBeLessThanOrEqual(target.x);
    expect(fit.y).toBeLessThanOrEqual(target.y);
    expect(fit.x + 1024 * fit.scale).toBeGreaterThanOrEqual(target.x + target.width);
    expect(fit.y + 1024 * fit.scale).toBeGreaterThanOrEqual(target.y + target.height);
  });
});

describe('insetArea', () => {
  it('returns the whole viewport when there are no insets', () => {
    const noInsets = { top: 0, right: 0, bottom: 0, left: 0 };

    expect(insetArea({ width: 390, height: 844 }, noInsets)).toEqual(area(390, 844));
  });

  it('removes a notch and a home indicator from a phone held sideways', () => {
    const insets = { top: 0, right: 47, bottom: 21, left: 47 };

    expect(insetArea({ width: 844, height: 390 }, insets)).toEqual(area(750, 369, 47, 0));
  });

  it('never returns a negative size', () => {
    const insets = { top: 300, right: 0, bottom: 300, left: 0 };

    expect(insetArea({ width: 390, height: 500 }, insets).height).toBe(0);
  });
});

describe('toDesignArea', () => {
  it('converts a viewport rectangle into the coordinates of a scaled, shifted root', () => {
    const fit = { scale: 0.5, x: 100, y: 0 };

    expect(toDesignArea(area(1160, 540), fit)).toEqual(area(2320, 1080, -200, 0));
  });
});
