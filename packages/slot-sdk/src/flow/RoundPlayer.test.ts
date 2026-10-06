import { describe, expect, it, vi } from 'vitest';
import type { RoundStep } from '../math/round';
import { RoundPlayer, type StepHandler } from './RoundPlayer';

/** A step a game could add, unknown to the SDK. */
interface GreetStep extends RoundStep {
  type: 'greet';
  name: string;
}

/** A step that stays on screen until the test resolves it or it is skipped. */
function createManualStep() {
  let finish = (): void => undefined;
  let skipSignal: AbortSignal | undefined;
  const handler: StepHandler<RoundStep> = (_step, skip) =>
    new Promise<void>((resolve) => {
      skipSignal = skip;
      finish = resolve;
      skip.addEventListener('abort', () => {
        resolve();
      });
    });
  return {
    handler,
    finish: () => {
      finish();
    },
    skipSignal: () => skipSignal,
  };
}

describe('RoundPlayer', () => {
  it('plays a game step with the handler registered for its type', async () => {
    const player = new RoundPlayer();
    const handler = vi.fn<StepHandler<GreetStep>>(() => Promise.resolve());
    player.register<GreetStep>('greet', handler);
    const step: GreetStep = { type: 'greet', name: 'Ann' };

    await player.play([step]);

    expect(handler).toHaveBeenCalledExactlyOnceWith(step, expect.any(AbortSignal));
  });

  it('plays steps one after another, each after the previous one is over', async () => {
    const player = new RoundPlayer();
    const log: string[] = [];
    const first = createManualStep();
    player.register('first', (step, skip) => {
      log.push('first started');
      return first.handler(step, skip);
    });
    player.register('second', () => {
      log.push('second started');
      return Promise.resolve();
    });

    const playing = player.play([{ type: 'first' }, { type: 'second' }]);
    await Promise.resolve();
    expect(log).toEqual(['first started']);
    expect(player.isPlaying).toBe(true);

    first.finish();
    await playing;
    expect(log).toEqual(['first started', 'second started']);
    expect(player.isPlaying).toBe(false);
  });

  it('checks every step type before playing the first one', async () => {
    const player = new RoundPlayer();
    const handler = vi.fn(() => Promise.resolve());
    player.register('greet', handler);

    await expect(player.play([{ type: 'greet' }, { type: 'tumble' }])).rejects.toThrow(
      'no handler for step "tumble"',
    );
    expect(handler).not.toHaveBeenCalled();
  });

  it('skips only the step on screen', async () => {
    const player = new RoundPlayer();
    const first = createManualStep();
    const second = createManualStep();
    player.register('first', first.handler);
    player.register('second', second.handler);

    const playing = player.play([{ type: 'first' }, { type: 'second' }]);
    player.skip();
    await vi.waitFor(() => {
      expect(second.skipSignal()).toBeDefined();
    });

    expect(first.skipSignal()?.aborted).toBe(true);
    expect(second.skipSignal()?.aborted).toBe(false);
    second.finish();
    await playing;
  });

  it('does nothing on skip between rounds', () => {
    expect(() => {
      new RoundPlayer().skip();
    }).not.toThrow();
  });

  it('stops at a failed step and can play the next round', async () => {
    const player = new RoundPlayer();
    const after = vi.fn(() => Promise.resolve());
    player.register('broken', () => Promise.reject(new Error('broken step')));
    player.register('after', after);

    await expect(player.play([{ type: 'broken' }, { type: 'after' }])).rejects.toThrow(
      'broken step',
    );
    expect(after).not.toHaveBeenCalled();
    expect(player.isPlaying).toBe(false);
    await player.play([{ type: 'after' }]);
    expect(after).toHaveBeenCalledOnce();
  });

  it('refuses to play two rounds at once', async () => {
    const player = new RoundPlayer();
    const step = createManualStep();
    player.register('slow', step.handler);

    const playing = player.play([{ type: 'slow' }]);
    await expect(player.play([{ type: 'slow' }])).rejects.toThrow('already playing');
    step.finish();
    await playing;
  });

  it('rejects a second handler for the same step type', () => {
    const player = new RoundPlayer();
    player.register('greet', () => Promise.resolve());

    expect(() => {
      player.register('greet', () => Promise.resolve());
    }).toThrow('step "greet" is already registered');
  });
});
