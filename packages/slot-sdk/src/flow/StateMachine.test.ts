import { describe, expect, it, vi } from 'vitest';
import { StateMachine, type Transitions } from './StateMachine';

type Light = 'red' | 'green' | 'yellow';

const transitions: Transitions<Light> = {
  red: ['green'],
  green: ['yellow'],
  yellow: ['red'],
};

describe('StateMachine', () => {
  it('starts in the initial state', () => {
    expect(new StateMachine(transitions, 'red', vi.fn()).current).toBe('red');
  });

  it('changes state along the table and reports each change', () => {
    const onChange = vi.fn();
    const machine = new StateMachine(transitions, 'red', onChange);

    machine.changeTo('green');
    machine.changeTo('yellow');

    expect(machine.current).toBe('yellow');
    expect(onChange.mock.calls).toEqual([['green'], ['yellow']]);
  });

  it('throws on a change the table does not allow and keeps the state', () => {
    const onChange = vi.fn();
    const machine = new StateMachine(transitions, 'red', onChange);

    expect(() => {
      machine.changeTo('yellow');
    }).toThrow('"red" cannot change to "yellow"');
    expect(machine.current).toBe('red');
    expect(onChange).not.toHaveBeenCalled();
  });
});
