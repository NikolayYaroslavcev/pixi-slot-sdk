import { describe, expect, it } from 'vitest';
import { defineComponent } from './component';
import { World } from './World';

const Position = defineComponent<{ x: number }>('Position');
const Label = defineComponent<{ text: string }>('Label');

describe('World', () => {
  it('creates entities with distinct ids', () => {
    const world = new World();
    const first = world.createEntity();
    const second = world.createEntity();

    expect(first).not.toBe(second);
    expect(world.isAlive(first)).toBe(true);
  });

  it('destroys an entity together with its components', () => {
    const world = new World();
    const entity = world.createEntity();
    world.add(entity, Position, { x: 1 });

    world.destroyEntity(entity);

    expect(world.isAlive(entity)).toBe(false);
    expect(world.get(entity, Position)).toBeUndefined();
    expect(world.query(Position)).toEqual([]);
  });

  it('does not reuse the id of a destroyed entity', () => {
    const world = new World();
    const destroyed = world.createEntity();
    world.destroyEntity(destroyed);

    expect(world.createEntity()).not.toBe(destroyed);
  });

  it('refuses to change an entity that does not exist', () => {
    const world = new World();
    const entity = world.createEntity();
    world.destroyEntity(entity);

    expect(() => {
      world.add(entity, Position, { x: 1 });
    }).toThrow(/entity \d+ does not exist/);
    expect(() => {
      world.destroyEntity(entity);
    }).toThrow(/does not exist/);
  });

  it('adds, reads, replaces and removes a component', () => {
    const world = new World();
    const entity = world.createEntity();

    world.add(entity, Position, { x: 1 });
    expect(world.get(entity, Position)).toEqual({ x: 1 });
    expect(world.has(entity, Position)).toBe(true);
    expect(world.has(entity, Label)).toBe(false);

    world.add(entity, Position, { x: 2 });
    expect(world.get(entity, Position)).toEqual({ x: 2 });

    world.remove(entity, Position);
    expect(world.get(entity, Position)).toBeUndefined();
    expect(world.isAlive(entity)).toBe(true);
  });

  it('returns the stored object, so systems change data in place', () => {
    const world = new World();
    const entity = world.createEntity();
    world.add(entity, Position, { x: 1 });

    const position = world.get(entity, Position);
    if (position) {
      position.x = 5;
    }

    expect(world.get(entity, Position)).toEqual({ x: 5 });
  });

  it('queries entities that have every listed component', () => {
    const world = new World();
    const both = world.createEntity();
    const positionOnly = world.createEntity();
    const labelOnly = world.createEntity();
    world.add(both, Position, { x: 0 });
    world.add(both, Label, { text: 'both' });
    world.add(positionOnly, Position, { x: 0 });
    world.add(labelOnly, Label, { text: 'label' });

    expect(world.query(Position)).toEqual([both, positionOnly]);
    expect(world.query(Position, Label)).toEqual([both]);
    expect(world.query(Label, Position)).toEqual([both]);
  });

  it('returns an empty query for a component nobody has', () => {
    const world = new World();
    world.createEntity();

    expect(world.query(Label)).toEqual([]);
  });

  it('updates systems in the order they were added', () => {
    const world = new World();
    const calls: string[] = [];
    world.addSystem({ update: (deltaMs) => calls.push(`motion ${String(deltaMs)}`) });
    world.addSystem({ update: (deltaMs) => calls.push(`layout ${String(deltaMs)}`) });

    world.update(16);

    expect(calls).toEqual(['motion 16', 'layout 16']);
  });
});
