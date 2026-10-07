import type { EventBus } from '../core/EventBus';
import type { GameEvents } from '../core/GameEvents';
import type { Win } from '../math/round';
import type { Pause, WinField } from './winSteps';

/**
 * After a round, the wins of its last spin keep coming back one by one while the player waits,
 * so a win can be read again before the next Spin. Only wins of the field on screen: every new
 * spin forgets the old ones, also inside a free spins series. The next round stops it at once.
 */
export class IdleWinReplay {
  private wins: readonly Win[] = [];
  private running: AbortController | null = null;

  /** `winMs` is how long each win stays; `field()` is the field the game has connected, if any. */
  constructor(
    events: EventBus<GameEvents>,
    private readonly pause: Pause,
    private readonly winMs: number,
    private readonly field: () => WinField | null,
  ) {
    events.on('winsShown', ({ wins }) => {
      this.wins = wins;
    });
    events.on('spinStarted', () => {
      this.wins = [];
    });
    events.on('roundStateChanged', (state) => {
      if (state === 'idle') {
        this.start();
      } else {
        this.stop();
      }
    });
  }

  private start(): void {
    const field = this.field();
    if (!field || this.wins.length === 0) {
      return;
    }
    this.stop();
    const running = new AbortController();
    this.running = running;
    void this.cycle(field, this.wins, running.signal);
  }

  private stop(): void {
    if (!this.running) {
      return;
    }
    this.running.abort();
    this.running = null;
    this.field()?.clear();
  }

  private async cycle(field: WinField, wins: readonly Win[], signal: AbortSignal): Promise<void> {
    for (let index = 0; !signal.aborted; index = (index + 1) % wins.length) {
      const win = wins[index];
      if (win) {
        field.showOne(win);
      }
      await this.pause(this.winMs, signal);
    }
  }
}
