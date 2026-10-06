type Listener<Payload> = (payload: Payload) => void;

/**
 * Typed publish/subscribe channel. `Events` maps an event name to its payload type,
 * so `emit('betChanged', 'ten')` is a compile error when `betChanged` carries a number.
 *
 * Each game creates its own bus: there is no shared global instance.
 */
export class EventBus<Events extends object> {
  // Listeners of different events have different payload types, so the map stores them
  // under the widest common type. `on` and `emit` restore the precise type per event name.
  private readonly listeners = new Map<keyof Events, Set<Listener<never>>>();

  /** Calls `listener` every time `name` is emitted. */
  on<Name extends keyof Events>(name: Name, listener: Listener<Events[Name]>): void {
    const listenersOfEvent = this.listeners.get(name) ?? new Set();
    listenersOfEvent.add(listener);
    this.listeners.set(name, listenersOfEvent);
  }

  /** Removes a listener added with `on`. Pass the same function reference. */
  off<Name extends keyof Events>(name: Name, listener: Listener<Events[Name]>): void {
    this.listeners.get(name)?.delete(listener);
  }

  /** Calls every listener of `name` with `payload`, in subscription order. */
  emit<Name extends keyof Events>(name: Name, payload: Events[Name]): void {
    const listenersOfEvent = this.listeners.get(name);
    if (!listenersOfEvent) {
      return;
    }
    // A copy, so a listener that subscribes or unsubscribes during emit does not affect this call.
    for (const listener of [...listenersOfEvent] as Listener<Events[Name]>[]) {
      listener(payload);
    }
  }
}
