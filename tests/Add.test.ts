import { chmodSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import Add from 'lib/command/Add.js';
import Init from 'lib/command/Init.js';
import { join } from 'path';
import { describe, expect, test } from 'vitest';
import { assertIndex, createTempRepo } from './helper.js';

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
    const { root, gitIndex } = createTempRepo();

    writeFileSync(join(root, FILE_NAME), 'hello');
    writeFileSync(join(root, 'bar.txt'), 'world');

    mkdirSync(join(root, 'nested/deep'), { recursive: true });
    writeFileSync(join(root, 'nested/file1.txt'), 'nested1');
    writeFileSync(join(root, 'nested/deep/file2.txt'), 'nested2');

    new Init({ targetDir: root, root }).run();
    new Add({ root, args: [FILE_NAME, 'bar.txt', 'nested'] }).run();

    expect(existsSync(gitIndex)).toBe(true);

    assertIndex(gitIndex, [
      FILE_NAME,
      'bar.txt',
      'nested/file1.txt',
      'nested/deep/file2.txt',
    ]);
  });

  test('adds an executable file to the index', () => {
    const { root, gitIndex } = createTempRepo();

    writeFileSync(join(root, FILE_NAME), 'hello');
    chmodSync(join(root, FILE_NAME), 0o755);

    new Init({ targetDir: root, root }).run();
    new Add({ root, args: [FILE_NAME] }).run();

    expect(existsSync(gitIndex)).toBe(true);

    assertIndex(gitIndex, [FILE_NAME]);
  });

  test('incrementally adds files to the index', () => {
    const { root, gitIndex } = createTempRepo();

    writeFileSync(join(root, FILE_NAME), 'hello');
    writeFileSync(join(root, 'world.txt'), 'world');

    new Init({ targetDir: root, root }).run();

    new Add({ root, args: [FILE_NAME] }).run();
    assertIndex(gitIndex, [FILE_NAME]);

    new Add({ root, args: ['world.txt'] }).run();
    assertIndex(gitIndex, [FILE_NAME, 'world.txt']);
  });
});
