import { describe, expect, it } from 'vitest';
import { posePart, type PartTransform } from './characterPose';

const rest: PartTransform = { x: 10, y: 20, rotation: 0.5, scaleX: 2, scaleY: 2, alpha: 0 };

describe('posePart', () => {
  it('keeps the rest pose when nothing plays or the pose leaves the part out', () => {
    expect(posePart(rest, [])).toEqual(rest);
    expect(posePart(rest, [{ pose: undefined, weight: 1 }])).toEqual(rest);
  });

  it('adds offsets and turns, multiplies scale and replaces alpha', () => {
    const posed = posePart(rest, [
      { pose: { x: 5, y: -5, rotation: 0.25, scaleX: 1.5, scaleY: 0.5, alpha: 1 }, weight: 1 },
    ]);

    expect(posed).toEqual({ x: 15, y: 15, rotation: 0.75, scaleX: 3, scaleY: 1, alpha: 1 });
  });

  it('mixes two poses by weight, counting a missing value as rest', () => {
    const posed = posePart(rest, [
      { pose: { x: 8, alpha: 1 }, weight: 0.25 },
      { pose: { scaleX: 3 }, weight: 0.75 },
    ]);

    expect(posed).toEqual({ x: 12, y: 20, rotation: 0.5, scaleX: 5, scaleY: 2, alpha: 0.25 });
  });
});
