import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createGame, findNameProblems, titleFromName } from './create-game.mjs';

const template = resolve(fileURLToPath(import.meta.url), '../../templates/game');

describe('create-game', () => {
  let root = '';

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'create-game-'));
    mkdirSync(join(root, 'games'));
    mkdirSync(join(root, 'packages', 'slot-sdk'), { recursive: true });
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  const read = (path) => readFileSync(join(root, 'games', 'treasure-test', path), 'utf8');

  it('copies the template and fills in the name and title', () => {
    createGame('treasure-test', { root, template });

    const pkg = JSON.parse(read('package.json'));
    expect(pkg.name).toBe('treasure-test');
    expect(pkg.dependencies['slot-sdk']).toBeDefined();
    expect(pkg.scripts).toMatchObject({ dev: 'vite', build: 'vite build' });
    expect(read('index.html')).toContain('<title>Treasure Test</title>');
    expect(read('public/assets/logo.svg')).toContain('Treasure Test');
    expect(read('src/main.ts')).toContain("from 'slot-sdk'");
  });

  it('leaves no placeholder behind', () => {
    createGame('treasure-test', { root, template });

    for (const path of ['package.json', 'index.html', 'README.md', 'public/assets/logo.svg']) {
      expect(read(path)).not.toMatch(/__GAME_[A-Z]+__/);
    }
  });

  it('asks for a name when there is none', () => {
    expect(findNameProblems(undefined, root)[0]).toContain('npm run create-game <name>');
    expect(() => createGame('', { root, template })).toThrow('Name the game');
  });

  it.each(['Treasure', 'treasure_test', 'treasure test', '2fast', '-x', 'a--b', 'a-', '../x', 'é'])(
    'rejects the invalid name "%s"',
    (name) => {
      expect(() => createGame(name, { root, template })).toThrow('not a valid game name');
    },
  );

  it('rejects a name that is too long', () => {
    expect(findNameProblems('a'.repeat(51), root)[0]).toContain('not a valid game name');
  });

  it('never overwrites an existing game', () => {
    mkdirSync(join(root, 'games', 'treasure-test'));
    writeFileSync(join(root, 'games', 'treasure-test', 'keep.txt'), 'mine');

    expect(() => createGame('treasure-test', { root, template })).toThrow('already exists');
    expect(read('keep.txt')).toBe('mine');
  });

  it('rejects the name of an SDK package', () => {
    expect(() => createGame('slot-sdk', { root, template })).toThrow('packages/');
  });

  it('turns the name into a title', () => {
    expect(titleFromName('treasure-hunt-2')).toBe('Treasure Hunt 2');
  });
});
