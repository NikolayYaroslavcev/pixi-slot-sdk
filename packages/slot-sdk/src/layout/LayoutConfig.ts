/** The two layouts every game describes. `LayoutManager` picks one by the shape of the screen. */
export type LayoutVariantName = 'landscape' | 'portrait';

/** Placement of one named object, in design coordinates of its variant. */
export interface LayoutNode {
  x: number;
  y: number;
  /** Uniform scale. Default 1. */
  scale?: number;
  /**
   * Which point of the object lands on `x, y`, as a fraction of its bounds: `{ x: 0.5, y: 0.5 }`
   * is the center. Bounds are measured every time the layout is applied, so leave it unset
   * for objects whose content moves; then the object's own origin lands on `x, y`.
   */
  anchor?: { x: number; y: number };
  /** Default true. */
  visible?: boolean;
}

/** One layout: the size of the design area and where each named object goes inside it. */
export interface LayoutVariant<NodeName extends string = string> {
  /** Design width. Everything inside the design area is placed in these coordinates. */
  width: number;
  height: number;
  nodes: Record<NodeName, LayoutNode>;
}

/**
 * Layout of a game, written in `layout.ts`. Pass the node names as `NodeName` to make
 * the compiler check that both variants place the same objects:
 *
 * ```ts
 * export const layout: LayoutConfig<'logo' | 'reels'> = { landscape: {...}, portrait: {...} };
 * ```
 */
export type LayoutConfig<NodeName extends string = string> = Record<
  LayoutVariantName,
  LayoutVariant<NodeName>
>;

/** Runtime checks for what the types cannot see: sizes and nodes missing in one variant. */
export function findLayoutProblems(config: LayoutConfig): string[] {
  const problems: string[] = [];
  const { landscape, portrait } = config;
  for (const [name, variant] of Object.entries(config)) {
    if (!(variant.width > 0 && variant.height > 0)) {
      problems.push(
        `layout.${name} must have a positive width and height, got ${String(variant.width)} × ${String(variant.height)}`,
      );
    }
  }
  const missingInPortrait = Object.keys(landscape.nodes).filter(
    (node) => !Object.hasOwn(portrait.nodes, node),
  );
  const missingInLandscape = Object.keys(portrait.nodes).filter(
    (node) => !Object.hasOwn(landscape.nodes, node),
  );
  for (const node of missingInPortrait) {
    problems.push(`layout.portrait.nodes is missing "${node}"`);
  }
  for (const node of missingInLandscape) {
    problems.push(`layout.landscape.nodes is missing "${node}"`);
  }
  return problems;
}
