import { existsSync, writeFileSync } from 'fs';
import Command from 'lib/command/Command.js';
import { JitCommand } from 'lib/types/JitCommand.js';
import { join } from 'path';
import { describe, expect, test } from 'vitest';
import { createTempRepo } from './helper.js';

const FILE_NAME = 'foo.txt';
const COMMIT_MSG = 'first commit';

describe('Command', () => {
  test('creates a .git folder', () => {
    const { root } = createTempRepo();
    writeFileSync(join(root, FILE_NAME), 'hello');

    new Command().dispatch(JitCommand.Init, { targetDir: root, root });

    expect(existsSync(join(root, '.git'))).toBe(true);
  });

  test('adds a single file', () => {
    const { root } = createTempRepo();
    writeFileSync(join(root, FILE_NAME), 'hello');

    new Command().dispatch(JitCommand.Init, { targetDir: root, root });
    new Command().dispatch(JitCommand.Add, {
      targetDir: root,
      root,
      args: [FILE_NAME],
    });

    expect(existsSync(join(root, '.git', 'objects'))).toBe(true);
  });

  test('creates a commit', () => {
    const { root } = createTempRepo();
    writeFileSync(join(root, FILE_NAME), 'hello');

    new Command().dispatch(JitCommand.Init, { targetDir: root, root });
    new Command().dispatch(JitCommand.Add, {
      targetDir: root,
      root,
      args: [FILE_NAME],
    });
    new Command().dispatch(JitCommand.Commit, { root, message: COMMIT_MSG });

    expect(existsSync(join(root, '.git', 'HEAD'))).toBe(true);
  });
});
