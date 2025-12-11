import { chmodSync, existsSync, writeFileSync } from 'fs';
import Add from 'lib/command/Add.js';
import Commit from 'lib/command/Commit.js';
import Init from 'lib/command/Init.js';
import { ExitError } from 'lib/errors/index.js';
import { join } from 'path';
import { describe, expect, test, vi } from 'vitest';
import { createTempRepo } from './helper.js';

const FILE_NAME = 'foo.txt';

vi.mock('node:process', () => ({
  exit: vi.fn(),
  argv: process.argv,
  env: process.env,
}));

describe('Commit', () => {
  test('creates a commit', () => {
    const { root } = createTempRepo();
    writeFileSync(join(root, FILE_NAME), 'hello');

    new Init({ root }).run();
    new Add({ root, args: [FILE_NAME] }).run();
    new Commit({ root, message: 'first commit' }).run();

    expect(existsSync(join(root, '.git', 'HEAD'))).toBe(true);
  });

  test('fails on unreadable file', () => {
    const { root } = createTempRepo();
    writeFileSync(join(root, FILE_NAME), 'hello');
    chmodSync(join(root, FILE_NAME), 0o000);

    new Init({ targetDir: root, root }).run();
    try {
      new Add({ root, args: [FILE_NAME] }).run();
    } catch (err) {
      expect(err).toBeInstanceOf(ExitError);
      expect(err.exitCode).toBe(128);
    }
  });
});
