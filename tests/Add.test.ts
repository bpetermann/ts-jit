import { existsSync, mkdirSync, writeFileSync } from 'fs';
import Add from 'lib/command/Add.js';
import Init from 'lib/command/Init.js';
import { join } from 'path';
import { describe, expect, test } from 'vitest';
import { createTempRepo } from './helper.js';

const FILE_NAME = 'foo.txt';

describe('Add', () => {
  test('adds a single file', () => {
    const { root } = createTempRepo();
    writeFileSync(join(root, FILE_NAME), 'hello');

    new Init({ targetDir: root, root }).run();
    new Add({ root, args: [FILE_NAME] }).run();

    expect(existsSync(join(root, '.git', 'objects'))).toBe(true);
  });

  test('adds multiple files including nested folders', () => {
    const { root } = createTempRepo();

    writeFileSync(join(root, FILE_NAME), 'hello');
    writeFileSync(join(root, 'bar.txt'), 'world');

    mkdirSync(join(root, 'nested/deep'), { recursive: true });
    writeFileSync(join(root, 'nested/file1.txt'), 'nested1');
    writeFileSync(join(root, 'nested/deep/file2.txt'), 'nested2');

    new Init({ targetDir: root, root }).run();
    new Add({ root, args: [FILE_NAME, 'bar.txt', 'nested'] }).run();

    expect(existsSync(join(root, '.git', 'index'))).toBe(true);
  });
});
