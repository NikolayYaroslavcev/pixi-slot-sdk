import { Container, Sprite, type BLEND_MODES, type Texture } from 'pixi.js';

type Point = { x: number; y: number };

/**
 * One layer of a character drawn as separate images. Coordinates of a part are pixels of its
 * own image; where it goes is given in its parent's pixels (`position`). For art painted on a
 * shared canvas, where every image is the whole canvas with its part in place, leave `position`
 * out: the part then stays where the canvas painted it.
 */
export interface CharacterLayer<Part extends string = string> {
  /** Alias of the image in the asset manifest. None for a group that only carries other parts. */
  texture?: string;
  /** The part this one moves with. It must come earlier in the list. */
  parent?: Part;
  /** Drawn behind its parent's own image instead of in front of it. */
  behind?: boolean;
  /** The point of the image the part turns and scales around. */
  pivot: Point;
  /** Where the pivot lands in the parent. Default: the pivot itself (shared-canvas art). */
  position?: Point;
  /** Rest turn in radians, around the pivot. Default 0. */
  rotation?: number;
  /** Rest scale, around the pivot. Default 1. */
  scale?: number;
  /** Flipped left to right, so one image serves both sides. Default false. */
  mirror?: boolean;
  /** E.g. `add` for glows painted on a dark background. Default normal. */
  blendMode?: BLEND_MODES;
  /** Rest alpha. 0 for what only some animations show, e.g. an expression. Default 1. */
  alpha?: number;
}

/** Input of `buildLayeredCharacter`: the layers of one painted canvas and where it stands. */
export interface LayeredCharacterOptions<Part extends string> {
  /** Layers from back to front; a part with a parent is drawn with that parent. */
  layers: Readonly<Record<Part, CharacterLayer<Part>>>;
  /** The point of the canvas the layout places, e.g. between the feet. */
  origin: Point;
  /** Looks up a loaded image by alias. */
  texture: (alias: string) => Texture;
}

/**
 * Builds a character from layers into a container per part, ready for `CharacterActor`. Every
 * part works in canvas coordinates: its pivot and position both sit on its pivot point, so at
 * rest each image lands where the canvas painted it, and a turn turns it around that point.
 */
export function buildLayeredCharacter<Part extends string>(
  options: LayeredCharacterOptions<Part>,
): { view: Container; parts: Record<Part, Container> } {
  // The layout owns the view's transform, pivot included, so the origin shift lives one level in.
  const view = new Container({ label: 'character' });
  const canvas = new Container({ label: 'canvas' });
  canvas.position.set(-options.origin.x, -options.origin.y);
  view.addChild(canvas);
  const parts = {} as Record<Part, Container>;
  const behindCount = new Map<Container, number>();
  for (const [name, layer] of Object.entries(options.layers) as [Part, CharacterLayer<Part>][]) {
    const part = createPart(name, layer, options.texture);
    const parent =
      layer.parent === undefined ? canvas : (parts[layer.parent] as Container | undefined);
    if (!parent) {
      throw new Error(
        `buildLayeredCharacter: "${name}" comes before its parent "${String(layer.parent)}"`,
      );
    }
    if (layer.behind) {
      const index = behindCount.get(parent) ?? 0;
      parent.addChildAt(part, index);
      behindCount.set(parent, index + 1);
    } else {
      parent.addChild(part);
    }
    parts[name] = part;
  }
  return { view, parts };
}

function createPart<Part extends string>(
  name: Part,
  layer: CharacterLayer<Part>,
  texture: (alias: string) => Texture,
): Container {
  const { pivot, position = pivot, rotation = 0, scale = 1, alpha = 1 } = layer;
  const part = new Container({ label: name, alpha, rotation });
  part.pivot.set(pivot.x, pivot.y);
  part.position.set(position.x, position.y);
  part.scale.set(layer.mirror ? -scale : scale, scale);
  if (layer.texture !== undefined) {
    const sprite = new Sprite(texture(layer.texture));
    sprite.blendMode = layer.blendMode ?? 'normal';
    part.addChild(sprite);
  }
  return part;
}
