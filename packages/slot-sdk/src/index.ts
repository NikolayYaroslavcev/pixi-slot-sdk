// Public API of the SDK. Games import only from here: `import { createSlotGame } from 'slot-sdk'`.

export { createSlotGame } from './core/createSlotGame';
export type { SlotGame, SlotGameOptions } from './core/SlotGame';
export type { GameConfig, WinPresentationConfig } from './core/GameConfig';
export type { GameContext } from './core/GameContext';
export type { Feature } from './core/Feature';
export type { SceneLayers } from './core/sceneLayers';
export { EventBus } from './core/EventBus';
export type { GameEvents } from './core/GameEvents';
export type { GameModel } from './core/GameModel';

export { World, type System, type Entity } from './ecs/World';
export { defineComponent, type ComponentType } from './ecs/component';
export { Held, type CellPosition } from './reels/components';
export { ReelGrid, type ReelGridSize } from './reels/ReelGrid';
export {
  ReelGridView,
  type ReelGridViewOptions,
  type MotionBlurOptions,
} from './reels/ReelGridView';
export { ReelMotionSystem } from './reels/ReelMotionSystem';
export type { ReelMotionSettings } from './reels/reelMotion';
export type { LayoutManager } from './layout/LayoutManager';
export type {
  LayoutConfig,
  LayoutNode,
  LayoutVariant,
  LayoutVariantName,
} from './layout/LayoutConfig';
export type { StepHandler, StepRegistry } from './flow/RoundPlayer';
export type { WinControls, WinField, WinTiming } from './flow/winSteps';
export {
  Highlight,
  HighlightSystem,
  type HighlightData,
  type HighlightStyle,
} from './wins/Highlight';
export { FieldWinView } from './wins/FieldWinView';
export type { BigWinTier } from './wins/bigWinTier';
export type { WinStyle } from './wins/WinStyle';
export type { ParticleStyle } from './wins/WinParticles';
export { WinCounter, type WinCounterStyle } from './ui/WinCounter';
export { LabeledValue, type LabeledValueStyle } from './ui/LabeledValue';
export type { HudNodeName } from './ui/Hud';
export type {
  ResultSource,
  RoundRequest,
  RoundResult,
  RoundStep,
  RevealStep,
  WinsStep,
  TotalWinStep,
  StandardStep,
  Win,
} from './math/round';
export { createRng, randomIndex, pickWeighted, type Rng, type Weighted } from './math/rng';

export type { AssetEntry, AssetManifest, SymbolPlaceholder } from './assets/AssetManifest';
export type { LoadedAssets } from './assets/LoadedAssets';
export type { LoadingScreenStyle } from './assets/LoadingScreen';

export {
  tween,
  wait,
  waitUnlessSkipped,
  type Tween,
  type TweenOptions,
  type TweenProps,
} from './anim/tween';
export { formatMoney } from './math/money';
export {
  linear,
  easeInQuad,
  easeOutQuad,
  easeInOutQuad,
  easeOutCubic,
  easeOutBack,
  type Easing,
} from './anim/easing';
