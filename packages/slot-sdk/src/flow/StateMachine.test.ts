import { describe, expect, it } from 'vitest';
import { StateMachine, type State } from './StateMachine';

function createLoggingState(name: string, log: string[]): State {
  return {
    enter: () => log.push(`${name}.enter`),
    exit: () => log.push(`${name}.exit`),
    update: (deltaMs) => log.push(`${name}.update ${String(deltaMs)}`),
  };
}

describe('StateMachine', () => {
  it('exits the old state before entering the new one', () => {
    const log: string[] = [];
    const machine = new StateMachine();
    machine.changeTo(createLoggingState('first', log));

    machine.changeTo(createLoggingState('second', log));

    expect(log).toEqual(['first.enter', 'first.exit', 'second.enter']);
  });

  it('updates only the current state', () => {
    const log: string[] = [];
    const machine = new StateMachine();
    machine.update(16);
    machine.changeTo(createLoggingState('only', log));

    machine.update(16);

    expect(log).toEqual(['only.enter', 'only.update 16']);
  });
});
