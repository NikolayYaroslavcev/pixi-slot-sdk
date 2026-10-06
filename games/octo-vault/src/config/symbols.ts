/** Role of a symbol in the rules. Payouts and mechanics are tied to the role, not to the art. */
export type SymbolTier = 'low' | 'high' | 'wild' | 'scatter';

/**
 * Every symbol of Octo Vault. The keys are the only list of symbol ids in the game:
 * `SymbolId` is derived from them, and the asset manifest, the reels and later
 * the paytable are checked against it.
 */
export const symbols = {
  shell: { tier: 'low' },
  starfish: { tier: 'low' },
  seahorse: { tier: 'low' },
  fish: { tier: 'low' },
  pearl: { tier: 'high' },
  anchor: { tier: 'high' },
  chest: { tier: 'high' },
  crown: { tier: 'high' },
  octopus: { tier: 'wild' },
  key: { tier: 'scatter' },
} as const satisfies Record<string, { tier: SymbolTier }>;

export type SymbolId = keyof typeof symbols;

/** Symbols that pay on lines by themselves: every symbol except the Wild and the Scatter. */
export type RegularSymbolId = {
  [Id in SymbolId]: (typeof symbols)[Id]['tier'] extends 'low' | 'high' ? Id : never;
}[SymbolId];

/** A whole field: one array of symbols per reel, from the top. */
export type SymbolGrid = readonly (readonly SymbolId[])[];

export function isRegularSymbol(symbolId: SymbolId): symbolId is RegularSymbolId {
  const { tier } = symbols[symbolId];
  return tier === 'low' || tier === 'high';
}

export function isWild(symbolId: SymbolId): boolean {
  return symbols[symbolId].tier === 'wild';
}

export function isScatter(symbolId: SymbolId): boolean {
  return symbols[symbolId].tier === 'scatter';
}
