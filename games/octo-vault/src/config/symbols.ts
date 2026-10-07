/** Role of a symbol in the rules. Payouts and mechanics are tied to the role, not to the art. */
export type SymbolTier = 'low' | 'high' | 'wild' | 'scatter';

/**
 * Every symbol of the game. The keys are the only list of symbol ids: `SymbolId` is derived
 * from them, and the asset manifest, the reels and the paytable are checked against it.
 */
export const symbols = {
  jack: { tier: 'low' },
  queen: { tier: 'low' },
  king: { tier: 'low' },
  ace: { tier: 'low' },
  rum: { tier: 'high' },
  anchor: { tier: 'high' },
  map: { tier: 'high' },
  compass: { tier: 'high' },
  octopus: { tier: 'wild' },
  chest: { tier: 'scatter' },
} as const satisfies Record<string, { tier: SymbolTier }>;

export type SymbolId = keyof typeof symbols;

/** The symbol a cell becomes when the Grab turns it into a Wild. */
export const wildSymbol: SymbolId = 'octopus';

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
