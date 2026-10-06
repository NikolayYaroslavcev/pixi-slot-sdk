import { createRng, type WinsStep } from 'slot-sdk';
import { describe, expect, it } from 'vitest';
import { scenarios } from '../mock/scenarios';
import { evaluateSpin } from './evaluateSpin';
import { playSpin, spinSteps } from './playSpin';
import type { TentaclesStep } from './steps';

const bet = 100;

describe('playSpin', () => {
  it('pays the lines on the field after the Grab, with its multipliers', () => {
    const spin = playSpin(scenarios.tentacles, bet, createRng(3));
    const { grid, multipliers } = spin.field;

    expect(spin.grabs).toHaveLength(2);
    expect(spin.outcome).toEqual(evaluateSpin(grid, bet, multipliers));
  });

  it('shows the landing, the tentacles and the wins in this order', () => {
    const spin = playSpin(scenarios.tentacles, bet, createRng(3));
    const steps = spinSteps(spin);
    const tentacles = steps[1] as TentaclesStep;

    expect(steps.map((step) => step.type)).toEqual(
      spin.outcome.wins.length > 0 ? ['reveal', 'tentacles', 'wins'] : ['reveal', 'tentacles'],
    );
    expect(steps[0]).toEqual({ type: 'reveal', grid: scenarios.tentacles });
    expect(tentacles.grabs).toEqual(spin.grabs);
  });

  it('has no tentacles step without an Octopus', () => {
    const steps = spinSteps(playSpin(scenarios.multiwin, bet, createRng(3)));

    expect(steps.map((step) => step.type)).toEqual(['reveal', 'wins']);
  });

  it('puts the multiplier of a line next to its amount', () => {
    // Look for a seed where the Grab makes a multiplied line, then check how it is shown.
    for (let seed = 1; seed < 200; seed += 1) {
      const spin = playSpin(scenarios.tentacles, bet, createRng(seed));
      const multiplied = spin.outcome.wins.find((win) => win.multiplier > 1);
      if (!multiplied) {
        continue;
      }
      const wins = spinSteps(spin).find((step) => step.type === 'wins') as WinsStep;
      expect(wins.wins).toContainEqual({
        ...multiplied,
        caption: `×${String(multiplied.multiplier)}`,
      });
      return;
    }
    throw new Error('no seed below 200 makes a multiplied line');
  });

  it('plays the same spin for the same seed', () => {
    expect(playSpin(scenarios.tentacles, bet, createRng(8))).toEqual(
      playSpin(scenarios.tentacles, bet, createRng(8)),
    );
  });
});
