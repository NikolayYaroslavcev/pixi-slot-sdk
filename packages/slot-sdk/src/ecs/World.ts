import type { ComponentType } from './component';

/**
 * An entity is only a number. Everything it is made of lives in its components.
 * The brand keeps a plain number, such as a reel index, from being passed as an entity.
 */
export type Entity = number & { readonly __entity: true };

/** Per-frame logic registered in the world. */
export interface System {
  update(deltaMs: number): void;
}

/**
 * Entities, their components and the systems that work on them.
 *
 * A component is a plain data object stored per component type. Systems find the entities
 * they work on with `query` and change component data in place. There are no archetypes
 * and no scheduler: the field has a few dozen entities, a map per component type is enough.
 */
export class World {
  private readonly systems: System[] = [];
  private readonly entities = new Set<Entity>();
  private readonly stores = new Map<ComponentType<unknown>, Map<Entity, unknown>>();
  private nextEntity = 1;

  createEntity(): Entity {
    const entity = this.nextEntity as Entity;
    this.nextEntity += 1;
    this.entities.add(entity);
    return entity;
  }

  /** Removes the entity with all its components. Its id is never reused. */
  destroyEntity(entity: Entity): void {
    this.assertAlive(entity);
    for (const store of this.stores.values()) {
      store.delete(entity);
    }
    this.entities.delete(entity);
  }

  isAlive(entity: Entity): boolean {
    return this.entities.has(entity);
  }

  /** Adds the component to the entity, or replaces its data if the entity already has it. */
  add<Data>(entity: Entity, type: ComponentType<Data>, data: Data): void {
    this.assertAlive(entity);
    let store = this.stores.get(type);
    if (!store) {
      store = new Map();
      this.stores.set(type, store);
    }
    store.set(entity, data);
  }

  /** Component data of the entity, or undefined if it does not have the component. */
  get<Data>(entity: Entity, type: ComponentType<Data>): Data | undefined {
    // The store of `type` only ever receives `Data` through `add`.
    return this.stores.get(type)?.get(entity) as Data | undefined;
  }

  has(entity: Entity, type: ComponentType<unknown>): boolean {
    return this.stores.get(type)?.has(entity) ?? false;
  }

  remove(entity: Entity, type: ComponentType<unknown>): void {
    this.stores.get(type)?.delete(entity);
  }

  /** Entities that have every listed component, in the order they got the first one. */
  query(first: ComponentType<unknown>, ...rest: ComponentType<unknown>[]): Entity[] {
    const candidates = this.stores.get(first);
    if (!candidates) {
      return [];
    }
    return [...candidates.keys()].filter((entity) => rest.every((type) => this.has(entity, type)));
  }

  addSystem(system: System): void {
    this.systems.push(system);
  }

  /** Runs every system once, in the order they were added. */
  update(deltaMs: number): void {
    for (const system of this.systems) {
      system.update(deltaMs);
    }
  }

  private assertAlive(entity: Entity): void {
    if (!this.entities.has(entity)) {
      throw new Error(`World: entity ${String(entity)} does not exist`);
    }
  }
}
