import { existsSync } from 'fs';
import Jit from 'lib/Jit.js';
import { join } from 'path';
import { expect, test } from 'vitest';
import { createTempRepo } from './helper.js';

test('init creates .git folder', () => {
  const { root } = createTempRepo();

  new Jit().create(root);

  expect(existsSync(join(root, '.git'))).toBe(true);
});
