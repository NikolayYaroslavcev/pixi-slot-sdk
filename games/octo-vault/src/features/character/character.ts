import { Assets, type Container, type Texture } from 'pixi.js';
import {
  buildLayeredCharacter,
  CharacterActor,
  type CellPosition,
  type Feature,
  type GameContext,
} from 'slot-sdk';
import { captainArmLook, characterConfig, type OctopusPart } from '../../config/character.config';
import { reelsConfig } from '../../config/reels.config';
import type { ReelsFeature } from '../../scene/reels';
import type { TentacleReach } from '../tentacleGrab/tentacleGrab';
import { CaptainArms } from './CaptainArms';
import { CharacterDirector } from './CharacterDirector';
import { followRound } from './followRound';
import { octopusAnimations } from './octopusAnimations';

/** The captain: a feature, the hand that draws the Grab, and a way to take it all down. */
export interface CharacterFeature extends Feature, TentacleReach {
  /** Removes the captain, his tentacles and his subscriptions. For a game that rebuilds its scene. */
  destroy(): void;
}

/**
 * The octopus captain beside the reels, who acts out the round. Presentation only: it follows
 * the events the game already sends, holds nothing back and decides nothing. In the Grab his own
 * tentacles reach the grabbed cells (`reach`, given to `tentacleGrab`).
 * Install after the reels: the tentacles are drawn over them.
 */
export function character(reels: ReelsFeature): CharacterFeature {
  let installed: Captain | null = null;
  return {
    install(context) {
      installed = installCaptain(context, reels);
    },
    reach(_from: CellPosition, to: CellPosition, skip: AbortSignal): Promise<void> {
      if (!installed) {
        throw new Error('character: install the character before the Grab plays');
      }
      return installed.arms.reach(to, skip);
    },
    destroy() {
      installed?.unfollow();
      installed?.arms.destroy();
      installed?.actor.destroy();
      installed = null;
    },
  };
}

/** The captain on the scene: his actor, his reaching tentacles and the way to stop listening. */
interface Captain {
  actor: CharacterActor<OctopusPart>;
  arms: CaptainArms;
  unfollow: () => void;
}

function installCaptain(context: GameContext, reels: ReelsFeature): Captain {
  const actor = createActor(context);
  context.layers.scene.addChild(actor.view);
  context.layout.addNode('character', actor.view);
  const arms = createArms(context, reels, actor);
  const director = new CharacterDirector(actor, characterConfig.animations);
  const unfollow = followRound(context.events, director);
  const unpull = pullBackOn(context, arms);
  const unlift = liftOverBigWin(context, actor.view);
  return {
    actor,
    arms,
    unfollow: () => {
      unfollow();
      unpull();
      unlift();
    },
  };
}

/** The arms pull back as soon as the wins, a Big Win or the next spin come. */
function pullBackOn(context: GameContext, arms: CaptainArms): () => void {
  const pullBack = (): void => {
    arms.pullBack();
  };
  const events = ['winsShown', 'bigWinShown', 'spinStarted'] as const;
  for (const event of events) {
    context.events.on(event, pullBack);
  }
  return () => {
    for (const event of events) {
      context.events.off(event, pullBack);
    }
  };
}

/**
 * The captain celebrates the Big Win in front of its dim: while it is shown he moves to the
 * `winOverlay` layer, over the dim, and goes back to his place in the scene after it. Both layers
 * use design coordinates, so he stays where the layout put him.
 */
function liftOverBigWin(context: GameContext, view: Container): () => void {
  const { scene, winOverlay } = context.layers;
  let home = scene.getChildIndex(view);
  const lift = (): void => {
    if (view.parent === scene) {
      home = scene.getChildIndex(view);
    }
    winOverlay.addChild(view);
  };
  const putBack = (): void => {
    if (view.parent !== scene) {
      scene.addChildAt(view, Math.min(home, scene.children.length));
    }
  };
  context.events.on('bigWinShown', lift);
  context.events.on('bigWinEnded', putBack);
  return () => {
    context.events.off('bigWinShown', lift);
    context.events.off('bigWinEnded', putBack);
    putBack();
  };
}

/** The captain's reaching tentacles, drawn over the reels. */
function createArms(
  context: GameContext,
  reels: ReelsFeature,
  actor: CharacterActor<OctopusPart>,
): CaptainArms {
  const sources = captainArmLook.tentacles.map(({ part, from }) => ({
    part: actor.part(part),
    body: actor.part('body'),
    from,
  }));
  const look = { ...captainArmLook, cellWidth: reelsConfig.view.cellWidth };
  return new CaptainArms(context.app.ticker, context.layers.reels, reels.parts.view, sources, look);
}

function createActor(context: GameContext): CharacterActor<OctopusPart> {
  const { layers, origin, mixMs } = characterConfig;
  const { view, parts } = buildLayeredCharacter({
    layers,
    origin,
    texture: (alias) => Assets.get<Texture>(alias),
  });
  view.label = 'captain';
  return new CharacterActor({
    view,
    parts,
    animations: octopusAnimations,
    ticker: context.app.ticker,
    mixMs,
  });
}
