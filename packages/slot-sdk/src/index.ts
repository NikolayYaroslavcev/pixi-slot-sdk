// Public API of the SDK. Games import only from here: `import { createSlotGame } from 'slot-sdk'`.

export { createSlotGame } from './core/createSlotGame';
export type { SlotGame, SlotGameOptions } from './core/SlotGame';
export type { GameConfig } from './core/GameConfig';
export type { GameContext } from './core/GameContext';
export type { Feature } from './core/Feature';
export type { SceneLayers } from './core/sceneLayers';
export { EventBus } from './core/EventBus';
export type { GameEvents } from './core/GameEvents';
export type { GameModel } from './core/GameModel';

export type { World, System } from './ecs/World';
export type { LayoutManager } from './layout/LayoutManager';
export type {
  LayoutConfig,
  LayoutNode,
  LayoutVariant,
  LayoutVariantName,
} from './layout/LayoutConfig';
export type { StepHandler, StepRegistry } from './flow/RoundPlayer';
export type { ResultSource, RoundRequest, RoundResult, RoundStep } from './math/round';

export type { AssetEntry, AssetManifest, SymbolPlaceholder } from './assets/AssetManifest';
export type { LoadedAssets } from './assets/LoadedAssets';
export type { LoadingScreenStyle } from './assets/LoadingScreen';

export { tween, wait, type Tween, type TweenOptions, type TweenProps } from './anim/tween';
export {
  linear,
  easeInQuad,
  easeOutQuad,
  easeInOutQuad,
  easeOutCubic,
  type Easing,
} from './anim/easing';
