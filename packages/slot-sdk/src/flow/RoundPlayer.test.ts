import { describe, expect, it, vi } from 'vitest';
import type { RoundStep } from '../math/round';
import { RoundPlayer, type StepHandler } from './RoundPlayer';

interface GreetStep extends RoundStep {
  type: 'greet';
  name: string;
}

describe('RoundPlayer', () => {
  it('finds the handler registered for the step type', async () => {
    const player = new RoundPlayer();
    const handler = vi.fn<StepHandler<GreetStep>>(() => Promise.resolve());
    player.register<GreetStep>('greet', handler);
    const step: GreetStep = { type: 'greet', name: 'Ann' };

    await player.handlerFor(step)(step);

    expect(handler).toHaveBeenCalledExactlyOnceWith(step);
  });

  it('names the unknown step in the error', () => {
    const player = new RoundPlayer();

    expect(() => player.handlerFor({ type: 'tumble' })).toThrow('no handler for step "tumble"');
  });

  it('rejects a second handler for the same step type', () => {
    const player = new RoundPlayer();
    player.register('greet', () => Promise.resolve());

    expect(() => {
      player.register('greet', () => Promise.resolve());
    }).toThrow('step "greet" is already registered');
  });
});
