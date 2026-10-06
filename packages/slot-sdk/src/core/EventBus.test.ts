import { describe, expect, it, vi } from 'vitest';
import { EventBus } from './EventBus';

interface TestEvents {
  scoreChanged: number;
  greeted: { name: string };
}

describe('EventBus', () => {
  it('delivers the payload to a subscriber', () => {
    const events = new EventBus<TestEvents>();
    const listener = vi.fn();
    events.on('greeted', listener);

    events.emit('greeted', { name: 'Ann' });

    expect(listener).toHaveBeenCalledExactlyOnceWith({ name: 'Ann' });
  });

  it('calls every subscriber in subscription order', () => {
    const events = new EventBus<TestEvents>();
    const calls: string[] = [];
    events.on('scoreChanged', () => calls.push('first'));
    events.on('scoreChanged', () => calls.push('second'));

    events.emit('scoreChanged', 5);

    expect(calls).toEqual(['first', 'second']);
  });

  it('does not call subscribers of other events', () => {
    const events = new EventBus<TestEvents>();
    const listener = vi.fn();
    events.on('greeted', listener);

    events.emit('scoreChanged', 5);

    expect(listener).not.toHaveBeenCalled();
  });

  it('stops calling a listener after off', () => {
    const events = new EventBus<TestEvents>();
    const removed = vi.fn();
    const kept = vi.fn();
    events.on('scoreChanged', removed);
    events.on('scoreChanged', kept);

    events.off('scoreChanged', removed);
    events.emit('scoreChanged', 5);

    expect(removed).not.toHaveBeenCalled();
    expect(kept).toHaveBeenCalledOnce();
  });

  it('lets a listener unsubscribe itself during emit', () => {
    const events = new EventBus<TestEvents>();
    const onlyOnce = vi.fn(() => {
      events.off('scoreChanged', onlyOnce);
    });
    events.on('scoreChanged', onlyOnce);

    events.emit('scoreChanged', 1);
    events.emit('scoreChanged', 2);

    expect(onlyOnce).toHaveBeenCalledExactlyOnceWith(1);
  });

  it('ignores emit without subscribers', () => {
    const events = new EventBus<TestEvents>();

    expect(() => {
      events.emit('scoreChanged', 1);
    }).not.toThrow();
  });
});
