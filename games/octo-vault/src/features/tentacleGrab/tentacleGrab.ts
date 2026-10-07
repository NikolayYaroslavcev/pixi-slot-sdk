import type { CellPosition, Feature, World } from 'slot-sdk';
import { reelsConfig } from '../../config/reels.config';
import { wildSymbol } from '../../config/symbols';
import type { TentaclesStep } from '../../math/steps';
import type { TentacleHit } from '../../math/tentacleGrab';
import { Multiplier } from '../../scene/Multiplier';
import { MultiplierBadges } from '../../scene/MultiplierBadges';
import type { FieldParts, ReelsFeature } from '../../scene/reels';

/** Draws one tentacle reaching a cell; resolves once it is there, or at once when `skip` aborts. */
export interface TentacleReach {
  reach(from: CellPosition, to: CellPosition, skip: AbortSignal): Promise<void>;
}

/**
 * The Grab on screen: plays `tentacles` steps. `hand` draws a tentacle reaching each cell (in
 * Octo Vault, the captain's own), then the cell becomes a Wild with the multiplier the step gives.
 * The client calculates nothing: cells and multipliers come from the round script. Skip lands
 * every remaining grab at once.
 */
export function tentacleGrab(reels: ReelsFeature, hand: TentacleReach): Feature {
  return {
    install(context) {
      const field = reels.parts;
      // Badges after the tentacles, so a tentacle never covers a multiplier.
      context.world.addSystem(
        new MultiplierBadges(context.world, field, reelsConfig.multiplierBadge),
      );
      context.steps.register<TentaclesStep>('tentacles', async (step, skip) => {
        const hits = step.grabs.flatMap((grab) =>
          grab.hits.map((hit) => ({ ...hit, from: grab.from })),
        );
        for (const hit of hits) {
          if (!skip.aborted) {
            context.events.emit('tentacleThrown', undefined);
            await hand.reach(hit.from, hit.cell, skip);
          }
          applyHit(context.world, field, hit);
          context.events.emit('multiplierLanded', { value: hit.multiplier });
        }
      });
    },
  };
}

/** The cell becomes a Wild. Its entity stays, so the multiplier goes on the symbol now in the cell. */
function applyHit(
  world: World,
  field: FieldParts,
  hit: TentacleHit & { from: CellPosition },
): void {
  field.grid.setSymbol(hit.cell, wildSymbol);
  world.add(field.grid.symbolEntity(hit.cell), Multiplier, { value: hit.multiplier });
}
