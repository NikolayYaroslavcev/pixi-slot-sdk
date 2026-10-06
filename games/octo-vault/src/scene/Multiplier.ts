import { defineComponent } from 'slot-sdk';

/**
 * The multiplier of a Wild on the field, on its symbol entity. The client's copy of the
 * multipliers the round script gives; `MultiplierBadges` draws it. A symbol that lands
 * in the cell is a new entity, so its multiplier goes with the old symbol.
 */
export const Multiplier = defineComponent<{ value: number }>('Multiplier');
