import type { CellPosition, Feature, World } from 'slot-sdk';
import { tentacleLook } from '../../config/features.config';
import { reelsConfig } from '../../config/reels.config';
import { wildSymbol } from '../../config/symbols';
import type { TentaclesStep } from '../../math/steps';
import type { TentacleHit } from '../../math/tentacleGrab';
import { Multiplier } from '../../scene/Multiplier';
import { MultiplierBadges } from '../../scene/MultiplierBadges';
import type { FieldParts, ReelsFeature } from '../../scene/reels';
import { TentacleView } from './TentacleView';

/**
 * The Grab on screen: plays `tentacles` steps. Each tentacle grows from its Octopus to its cell,
 * then the cell becomes a Wild with the multiplier the step gives. The client calculates nothing:
 * cells and multipliers come from the round script. Skip lands every remaining grab at once.
 */
export function tentacleGrab(reels: ReelsFeature): Feature {
  return {
    install(context) {
      const field = reels.parts;
      const view = new TentacleView(context.app.ticker, field.view, tentacleLook);
      field.view.container.addChild(view.graphics);
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
            await view.reach(hit.from, hit.cell, skip);
          }
          applyHit(context.world, field, hit);
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
