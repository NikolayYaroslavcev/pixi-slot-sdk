import { describe, expect, it } from 'vitest';
import { unlockAudioOnGesture, type GestureTarget } from './unlockAudio';

/** A page that keeps its listeners in a set, so a test can count them and fire them. */
function createPage() {
  const listeners = new Set<() => void>();
  const target = {
    addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
  } as unknown as GestureTarget;
  const gesture = async () => {
    for (const listener of [...listeners]) {
      listener();
    }
    await Promise.resolve();
    await Promise.resolve();
  };
  return { listeners, target, gesture };
}

describe('unlockAudioOnGesture', () => {
  it('resumes the context on the first gesture and stops listening once it runs', async () => {
    const { listeners, target, gesture } = createPage();
    const context = {
      state: 'suspended' as AudioContextState,
      resume: () => {
        context.state = 'running';
        return Promise.resolve();
      },
    };
    unlockAudioOnGesture(context, target);
    expect(listeners.size).toBe(1);
    await gesture();
    expect(context.state).toBe('running');
    expect(listeners.size).toBe(0);
  });

  it('keeps listening when the browser refuses this gesture', async () => {
    const { listeners, target, gesture } = createPage();
    const context = { state: 'suspended' as AudioContextState, resume: () => Promise.resolve() };
    unlockAudioOnGesture(context, target);
    await gesture();
    expect(listeners.size).toBe(1);
  });
});
