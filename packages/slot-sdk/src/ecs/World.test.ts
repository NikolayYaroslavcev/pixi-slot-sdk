import { describe, expect, it } from 'vitest';
import { World } from './World';

describe('World', () => {
  it('updates systems in the order they were added', () => {
    const world = new World();
    const calls: string[] = [];
    world.addSystem({ update: (deltaMs) => calls.push(`motion ${String(deltaMs)}`) });
    world.addSystem({ update: (deltaMs) => calls.push(`layout ${String(deltaMs)}`) });

    world.update(16);

    expect(calls).toEqual(['motion 16', 'layout 16']);
  });
});
