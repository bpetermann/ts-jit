import { existsSync } from 'fs';
import Init from 'lib/command/Init.js';
import { join } from 'path';
import { describe, expect, test } from 'vitest';
import { createTempRepo } from './helper.js';

describe('Init', () => {
  test('creates .git folder', () => {
    const { root } = createTempRepo();

    new Init({ targetDir: root, root }).run();

    expect(existsSync(join(root, '.git'))).toBe(true);
  });
});
