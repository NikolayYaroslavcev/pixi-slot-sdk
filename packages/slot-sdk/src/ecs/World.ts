/** Per-frame logic registered in the world. */
export interface System {
  update(deltaMs: number): void;
}

/**
 * Runs systems once per frame in the order they were added.
 * Entities and components are added here together with the reels.
 */
export class World {
  private readonly systems: System[] = [];

  addSystem(system: System): void {
    this.systems.push(system);
  }

  update(deltaMs: number): void {
    for (const system of this.systems) {
      system.update(deltaMs);
    }
  }
}
