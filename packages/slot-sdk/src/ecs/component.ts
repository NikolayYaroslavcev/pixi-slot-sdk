/**
 * Key of one kind of component. `World` stores component data by this key, and its
 * `Data` parameter types what `add` accepts and `get` returns.
 */
export interface ComponentType<Data> {
  /** Shown in error messages and the debugger. */
  readonly name: string;
  /** Never set: only carries the data type. */
  readonly __data?: Data;
}

/**
 * Declares a component. Call it once per component, at module level:
 * `export const Multiplier = defineComponent<{ value: number }>('Multiplier');`
 */
export function defineComponent<Data>(name: string): ComponentType<Data> {
  return { name };
}
