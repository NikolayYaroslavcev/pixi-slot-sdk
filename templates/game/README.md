<!-- prettier-ignore -->
# __GAME_TITLE__

A slot on `slot-sdk`, created by `npm run create-game __GAME_NAME__` from `templates/game`.

```sh
npm run dev -w games/__GAME_NAME__      # dev server
npm run build -w games/__GAME_NAME__    # production build in dist/
npm run preview -w games/__GAME_NAME__  # serve the build
```

Open the game with `?debug=layout` to see the design area and every layout node.

## What to change

| File                           | What it holds                                             |
| ------------------------------ | --------------------------------------------------------- |
| `src/config/symbols.ts`        | Symbol ids and what three in a row pay                    |
| `src/config/reels.config.ts`   | Field size, cell sizes, spin timing, reel strips          |
| `src/config/game.config.ts`    | Balance, bets, colors, HUD texts, win presentation        |
| `src/assets.ts`                | Every file to load; symbols start as colored placeholders |
| `src/layout.ts`                | Where the reels and HUD go, landscape and portrait        |
| `src/mock/MockResultSource.ts` | The pretend server: replace with a client of the real one |
| `public/assets/`               | Art, sounds, fonts; `logo.svg` is shown while loading     |

A new mechanic is a `Feature` in `src/main.ts`, as `src/reels.ts` shows.
Import the SDK only from `slot-sdk`; ESLint rejects deep imports.
