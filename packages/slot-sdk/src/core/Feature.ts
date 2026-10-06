import type { GameContext } from './GameContext';

/**
 * Extension point of the SDK. A game passes features to `createSlotGame`, and each one
 * gets the full `GameContext` once, before the first frame: it adds scene objects,
 * subscribes to events and so on, without changes to the SDK.
 */
export interface Feature {
  install(context: GameContext): void;
}
