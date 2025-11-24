import { existsSync, writeFileSync } from 'fs';
import Jit from 'lib/Jit.js';
import { join } from 'path';
import { expect, test } from 'vitest';
import { createTempRepo } from './helper.js';

test('init creates .git folder', () => {
  const { root } = createTempRepo();

  const jit = new Jit();
  jit.create(root);

  expect(existsSync(join(root, '.git'))).toBe(true);
});

test('adds a single file', () => {
  const { root } = createTempRepo();
  writeFileSync(join(root, 'foo.txt'), 'hello');

  const jit = new Jit();
  jit.create(root);
  jit.add(root, ['foo.txt']);

  expect(existsSync(join(root, '.git', 'objects'))).toBe(true);
});

test('creates a commit', () => {
  const { root } = createTempRepo();
  writeFileSync(join(root, 'foo.txt'), 'hello');

  const jit = new Jit();
  jit.create(root);
  jit.commit(root, 'first commit');

  expect(existsSync(join(root, '.git', 'HEAD'))).toBe(true);
});
