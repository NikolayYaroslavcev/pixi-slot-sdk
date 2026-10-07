// Creates a new game from templates/game: `npm run create-game my-game`.
// Copies the template to games/<name>, fills in its placeholders and installs the workspace.

import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(fileURLToPath(import.meta.url), '../..');

/** Lowercase words of letters and digits joined by single hyphens, e.g. `treasure-hunt-2`. */
const NAME_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const MAX_NAME_LENGTH = 50;

/** Files whose text has placeholders. Anything else, e.g. an image, is copied as it is. */
const TEXT_FILE = /\.(ts|json|html|svg|md|css)$/;

/** The reasons `name` cannot be a new game, or an empty array when it can. */
export function findNameProblems(name, root = repositoryRoot) {
  if (!name) {
    return ['Name the game: npm run create-game <name>, e.g. npm run create-game treasure-hunt'];
  }
  if (!NAME_PATTERN.test(name) || name.length > MAX_NAME_LENGTH) {
    return [
      `"${name}" is not a valid game name. Use lowercase letters, digits and single hyphens, ` +
        `start with a letter, at most ${String(MAX_NAME_LENGTH)} characters, e.g. treasure-hunt.`,
    ];
  }
  if (existsSync(join(root, 'games', name))) {
    return [`games/${name} already exists. Choose another name or remove that folder first.`];
  }
  if (existsSync(join(root, 'packages', name))) {
    return [`"${name}" is already the name of a package in packages/. Choose another name.`];
  }
  return [];
}

/** "treasure-hunt-2" → "Treasure Hunt 2". */
export function titleFromName(name) {
  return name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Copies the template to `games/<name>` and replaces `__GAME_NAME__` and `__GAME_TITLE__`
 * in its text files. Throws with a readable message when the name cannot be used.
 * Returns the folder of the new game.
 */
export function createGame(name, { root = repositoryRoot, template } = {}) {
  const problems = findNameProblems(name, root);
  if (problems.length > 0) {
    throw new Error(problems.join('\n'));
  }
  const templateDir = template ?? join(root, 'templates', 'game');
  const gameDir = join(root, 'games', name);
  cpSync(templateDir, gameDir, {
    recursive: true,
    errorOnExist: true,
    force: false,
    filter: (source) => !/[\\/](node_modules|dist)$/.test(source),
  });
  const values = { __GAME_NAME__: name, __GAME_TITLE__: titleFromName(name) };
  for (const file of listFiles(gameDir).filter((path) => TEXT_FILE.test(path))) {
    const text = readFileSync(file, 'utf8');
    const filled = text.replace(
      /__GAME_NAME__|__GAME_TITLE__/g,
      (placeholder) => values[placeholder],
    );
    if (filled !== text) {
      writeFileSync(file, filled);
    }
  }
  return gameDir;
}

function listFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

/** Creates the game, then installs, so the workspace links the new package right away. */
function main([name, ...extra]) {
  try {
    if (extra.length > 0) {
      throw new Error('Give one name, e.g. npm run create-game treasure-hunt');
    }
    createGame(name);
  } catch (error) {
    console.error(`create-game: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
  console.log(`Created games/${name}. Installing the workspace…`);
  // A shell finds npm.cmd on Windows; one command string avoids Node's warning about shell args.
  const install = spawnSync('npm install', { cwd: repositoryRoot, stdio: 'inherit', shell: true });
  if (install.status !== 0) {
    console.error('create-game: npm install failed. Run it yourself, then start the game.');
    process.exit(1);
  }
  console.log(`\nDone. Start the game:\n  npm run dev -w games/${name}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2));
}
