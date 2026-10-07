import { formatMoney, waitUnlessSkipped, type Feature, type GameContext } from 'slot-sdk';
import { freeSpinsLook } from '../../config/features.config';
import type { FreeSpinsEndStep, FreeSpinsStartStep, FreeSpinsUpdateStep } from '../../math/steps';
import type { FieldParts, ReelsFeature } from '../../scene/reels';
import { FreeSpinsBanner } from './FreeSpinsBanner';
import { FreeSpinsPanel } from './FreeSpinsPanel';
import { holdStickyWilds, releaseStickyWilds } from './stickyWilds';

/**
 * Free spins on screen. The series comes whole in one round script, so this feature adds no
 * round state: it plays three steps and keeps what the panel shows while they run.
 * - `freeSpinsStart`: the Scatters light up and the intro card says how many spins.
 * - `freeSpinsUpdate`: the counter moves on and the sticky Wilds are held for the next spin.
 * - `freeSpinsEnd`: the Wilds are released and the summary card shows the series win.
 * Whenever the round is back in `idle`, after the series or after a failed round, the feature
 * is cleared, so nothing of a broken series stays on screen.
 */
export function freeSpins(reels: ReelsFeature): Feature {
  return {
    install(context) {
      const series = new FreeSpinsSeries(context, reels.parts);
      const { steps } = context;
      steps.register<FreeSpinsStartStep>('freeSpinsStart', (step, skip) =>
        series.start(step, skip),
      );
      steps.register<FreeSpinsUpdateStep>('freeSpinsUpdate', (step) => {
        series.update(step);
        return Promise.resolve();
      });
      steps.register<FreeSpinsEndStep>('freeSpinsEnd', (step, skip) => series.end(step, skip));
      context.events.on('roundStateChanged', (state) => {
        if (state === 'idle') {
          series.clear();
        }
      });
    },
  };
}

class FreeSpinsSeries {
  private readonly panel = new FreeSpinsPanel(freeSpinsLook.panel);
  private readonly banner: FreeSpinsBanner;
  private active = false;

  constructor(
    private readonly context: GameContext,
    private readonly field: FieldParts,
  ) {
    this.banner = new FreeSpinsBanner(context, freeSpinsLook.banner);
    for (const [name, node] of Object.entries(this.panel.nodes)) {
      context.layers.hud.addChild(node);
      context.layout.addNode(name, node);
    }
  }

  async start(step: FreeSpinsStartStep, skip: AbortSignal): Promise<void> {
    this.setActive(true);
    this.panel.show({ spin: 0, count: step.count, seriesWin: 0 });
    this.field.highlight.show(step.scatters);
    this.banner.show(freeSpinsLook.titles.intro, String(step.count));
    try {
      await this.pause(freeSpinsLook.introMs, skip);
    } finally {
      this.banner.hide();
      this.field.highlight.clear();
    }
  }

  update(step: FreeSpinsUpdateStep): void {
    this.panel.show(step);
    holdStickyWilds(this.context.world, this.field.grid, step.sticky);
  }

  async end(step: FreeSpinsEndStep, skip: AbortSignal): Promise<void> {
    releaseStickyWilds(this.context.world);
    this.panel.show({ spin: step.count, count: step.count, seriesWin: step.seriesWin });
    this.banner.show(freeSpinsLook.titles.summary, formatMoney(step.seriesWin));
    try {
      await this.pause(freeSpinsLook.summaryMs, skip);
    } finally {
      this.clear();
    }
  }

  /** Back to the base game: no held Wilds, no counter, no card. Safe to call at any time. */
  clear(): void {
    this.setActive(false);
    releaseStickyWilds(this.context.world);
    this.panel.hide();
    this.banner.hide();
  }

  /** Tells the rest of the game, e.g. the background, when a series begins and ends. */
  private setActive(active: boolean): void {
    if (this.active !== active) {
      this.active = active;
      this.context.events.emit('freeSpinsActive', active);
    }
  }

  private pause(ms: number, skip: AbortSignal): Promise<void> {
    return waitUnlessSkipped(this.context.app.ticker, ms, skip);
  }
}
