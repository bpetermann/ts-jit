import { chmodSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import Jit from 'lib/Jit.js';
import { join } from 'path';
import { describe, expect, test, vi } from 'vitest';
import { createTempRepo } from './helper.js';

const FILE_NAME = 'foo.txt' as const;

vi.mock('node:process', () => ({
  exit: vi.fn(),
  argv: process.argv,
  env: process.env,
}));

describe('Jit', () => {
  test('init creates .git folder', () => {
    const { root } = createTempRepo();

    const jit = new Jit();
    jit.create(root);

    expect(existsSync(join(root, '.git'))).toBe(true);
  });

  test('adds a single file', () => {
    const { root } = createTempRepo();
    writeFileSync(join(root, FILE_NAME), 'hello');

    const jit = new Jit();
    jit.create(root);
    jit.add(root, [FILE_NAME]);

    expect(existsSync(join(root, '.git', 'objects'))).toBe(true);
  });

  test('creates a commit', () => {
    const { root } = createTempRepo();
    writeFileSync(join(root, FILE_NAME), 'hello');

    const jit = new Jit();
    jit.create(root);
    jit.commit(root, 'first commit');

    expect(existsSync(join(root, '.git', 'HEAD'))).toBe(true);
  });

  test('fails on a unreadable file', () => {
    const { root } = createTempRepo();
    writeFileSync(join(root, FILE_NAME), 'hello');
    chmodSync(join(root, FILE_NAME), 0o000);

    const jit = new Jit();
    jit.create(root);

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    jit.add(root, [FILE_NAME]);

    expect(spy).toHaveBeenCalledWith(
      expect.stringMatching(/adding files failed/i)
    );

    spy.mockRestore();
  });

  test('adds multiple files', () => {
    const { root } = createTempRepo();

    writeFileSync(join(root, FILE_NAME), 'hello');
    writeFileSync(join(root, 'bar.txt'), 'world');

    mkdirSync(join(root, 'nested'));
    mkdirSync(join(root, 'nested/deep'), { recursive: true });

    writeFileSync(join(root, 'nested/file1.txt'), 'nested1');
    writeFileSync(join(root, 'nested/deep/file2.txt'), 'nested2');

    const jit = new Jit();
    jit.create(root);
    jit.add(root, ['.']);

    const indexFile = join(root, '.git', 'index');
    expect(existsSync(indexFile)).toBe(true);

    jit.commit(root, 'initial commit');
    const headFile = join(root, '.git', 'HEAD');
    expect(existsSync(headFile)).toBe(true);
  });
});
