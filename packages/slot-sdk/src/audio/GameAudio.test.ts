import { describe, expect, it, vi } from 'vitest';
import { GameAudio, type AudioPage } from './GameAudio';

function createBackend(known: string[] = ['click']) {
  return {
    exists: vi.fn((alias: string) => known.includes(alias)),
    play: vi.fn(),
    stop: vi.fn(),
    muteAll: vi.fn(),
    unmuteAll: vi.fn(),
    pauseAll: vi.fn(),
    resumeAll: vi.fn(),
  };
}

/** A page whose visibility the test switches. */
function createPage() {
  const target = new EventTarget();
  const page = Object.assign(target, { hidden: false });
  const setHidden = (hidden: boolean) => {
    page.hidden = hidden;
    target.dispatchEvent(new Event('visibilitychange'));
  };
  return { page: page as unknown as AudioPage, setHidden };
}

function createStorage(stored: Record<string, string> = {}) {
  return {
    getItem: vi.fn((key: string) => stored[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      stored[key] = value;
    }),
  };
}

function createAudio(backend = createBackend(), storage = createStorage()) {
  const { page, setHidden } = createPage();
  const audio = new GameAudio(backend, page, storage);
  return { audio, backend, storage, setHidden };
}

describe('GameAudio', () => {
  it('plays a sound of the manifest with its options', () => {
    const { audio, backend } = createAudio();

    audio.play('click', { volume: 0.5 });

    expect(backend.play).toHaveBeenCalledWith('click', { volume: 0.5 });
  });

  it('plays nothing for a sound that is not loaded, without failing', () => {
    const { audio, backend } = createAudio();

    expect(() => {
      audio.play('missing');
      audio.stop('missing');
    }).not.toThrow();
    expect(backend.play).not.toHaveBeenCalled();
    expect(backend.stop).not.toHaveBeenCalled();
  });

  it('mutes and unmutes everything and remembers the choice', () => {
    const { audio, backend, storage } = createAudio();

    audio.setMuted(true);
    expect(audio.muted).toBe(true);
    expect(backend.muteAll).toHaveBeenCalledOnce();
    expect(storage.setItem).toHaveBeenLastCalledWith('slot-sdk.muted', 'true');

    audio.setMuted(false);
    expect(audio.muted).toBe(false);
    expect(backend.unmuteAll).toHaveBeenCalledOnce();
  });

  it('starts muted when the player muted it last time', () => {
    const { audio, backend } = createAudio(
      createBackend(),
      createStorage({ 'slot-sdk.muted': 'true' }),
    );

    expect(audio.muted).toBe(true);
    expect(backend.muteAll).toHaveBeenCalledOnce();
  });

  it('works without storage, e.g. when the browser blocks it', () => {
    const blocked = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    const { audio } = createAudio(
      createBackend(),
      blocked as unknown as ReturnType<typeof createStorage>,
    );

    expect(audio.muted).toBe(false);
    expect(() => {
      audio.setMuted(true);
    }).not.toThrow();
    expect(audio.muted).toBe(true);
  });

  it('pauses on a hidden tab and continues when it is back', () => {
    const { backend, setHidden } = createAudio();

    setHidden(true);
    expect(backend.pauseAll).toHaveBeenCalledOnce();

    setHidden(false);
    expect(backend.resumeAll).toHaveBeenCalledOnce();
  });
});
