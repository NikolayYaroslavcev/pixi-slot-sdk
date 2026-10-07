import type { PartPose } from 'slot-sdk';
import { describe, expect, it } from 'vitest';
import { characterConfig } from '../../config/character.config';
import { octopusAnimations } from './octopusAnimations';

const loops = ['idle', 'spin', 'anticipation', 'bigwin'];
/** Coins and the coin trail fade to nothing at the seam, so their jump back is never seen. */
const fadingAtSeam = new Set(['coins', 'coin_trail']);

function animation(name: string): (typeof octopusAnimations)[string] {
  const found = octopusAnimations[name];
  if (!found) {
    throw new Error(`no animation ${name}`);
  }
  return found;
}

describe('octopus animations', () => {
  it('have an animation for every moment the game maps', () => {
    for (const name of Object.values(characterConfig.animations)) {
      expect(octopusAnimations[name], name).toBeDefined();
    }
  });

  it('move only parts the captain has', () => {
    const parts = new Set(Object.keys(characterConfig.layers));
    for (const [name, played] of Object.entries(octopusAnimations)) {
      const frames = Array.from({ length: played.durationMs / 50 + 1 }, (_, i) =>
        played.pose(i * 50),
      );
      const moved = new Set(frames.flatMap((pose) => Object.keys(pose)));
      expect(
        [...moved].filter((part) => !parts.has(part)),
        name,
      ).toEqual([]);
    }
  });

  it.each(loops)('%s loops without a jump: its last frame is its first', (name) => {
    const looped = animation(name);
    const first = looped.pose(0);
    const last = looped.pose(looped.durationMs);
    for (const [part, pose] of Object.entries<PartPose>(first)) {
      if (fadingAtSeam.has(part)) {
        continue;
      }
      const end = (last as Record<string, PartPose | undefined>)[part] ?? {};
      for (const [key, value] of Object.entries(pose) as [keyof PartPose, number][]) {
        expect(end[key], `${name}: ${part}.${key}`).toBeCloseTo(value, 3);
      }
    }
  });

  it('end the one-shot gestures back at rest, ready for the loop after them', () => {
    for (const name of ['grab', 'win']) {
      const gesture = animation(name);
      const body = gesture.pose(gesture.durationMs).body ?? {};
      expect(body.y ?? 0, name).toBeCloseTo(0, 3);
      expect(body.rotation ?? 0, name).toBeCloseTo(0, 3);
    }
  });
});
