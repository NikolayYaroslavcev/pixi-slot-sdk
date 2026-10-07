import { EventBus, type GameEvents } from 'slot-sdk';
import { describe, expect, it } from 'vitest';
import { followRound, type FollowingDirector } from './followRound';

function recordingDirector(): { director: FollowingDirector; calls: string[] } {
  const calls: string[] = [];
  const record = (name: string) => (): void => {
    calls.push(name);
  };
  const director: FollowingDirector = {
    spinStarted: record('spinStarted'),
    anticipationStarted: record('anticipationStarted'),
    spinCompleted: record('spinCompleted'),
    grab: record('grab'),
    win: record('win'),
    bigWinShown: record('bigWinShown'),
    bigWinEnded: record('bigWinEnded'),
    roundIdle: record('roundIdle'),
  };
  return { director, calls };
}

function playRound(events: EventBus<GameEvents>): void {
  events.emit('spinStarted', undefined);
  events.emit('reelAnticipated', { reelIndex: 3 });
  events.emit('spinCompleted', undefined);
  events.emit('tentacleThrown', undefined);
  events.emit('winsShown', { wins: [], amount: 100 });
  events.emit('bigWinShown', { tierIndex: 1, title: 'MEGA WIN' });
  events.emit('bigWinEnded', undefined);
  events.emit('roundStateChanged', 'spinning');
  events.emit('roundStateChanged', 'idle');
}

describe('followRound', () => {
  it('turns each event of the round into one call of the director', () => {
    const events = new EventBus<GameEvents>();
    const { director, calls } = recordingDirector();
    followRound(events, director);

    playRound(events);

    expect(calls).toEqual([
      'spinStarted',
      'anticipationStarted',
      'spinCompleted',
      'grab',
      'win',
      'bigWinShown',
      'bigWinEnded',
      'roundIdle',
    ]);
  });

  it('subscribes once: many rounds call the director once per event', () => {
    const events = new EventBus<GameEvents>();
    const { director, calls } = recordingDirector();
    followRound(events, director);

    for (let round = 0; round < 10; round++) {
      playRound(events);
    }

    expect(calls).toHaveLength(80);
  });

  it('stops listening to every event when asked', () => {
    const events = new EventBus<GameEvents>();
    const { director, calls } = recordingDirector();
    const unfollow = followRound(events, director);

    unfollow();
    playRound(events);

    expect(calls).toEqual([]);
  });

  it('follows anew after a restart, without the old listeners', () => {
    const events = new EventBus<GameEvents>();
    const first = recordingDirector();
    const second = recordingDirector();
    followRound(events, first.director)();
    followRound(events, second.director);

    playRound(events);

    expect(first.calls).toEqual([]);
    expect(second.calls).toHaveLength(8);
  });
});
