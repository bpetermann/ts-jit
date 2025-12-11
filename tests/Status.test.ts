import { mkdirSync, writeFileSync } from 'fs';
import Init from 'lib/command/Init.js';
import Status from 'lib/command/Status.js';
import { JitCommand } from 'lib/types/JitCommand.js';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import {
  commandRunner,
  createConsoleLogSpy,
  createTempRepo,
} from './helper.js';

const file1 = 'file.txt';
const file2 = 'another.txt';

describe('Status', () => {
  it('lists untracked files in name order', () => {
    const { root } = createTempRepo();

    new Init({ targetDir: root, root }).run();
    const logger = createConsoleLogSpy();

    writeFileSync(join(root, file1), '');
    writeFileSync(join(root, file2), '');

    new Status({ targetDir: root, root }).run();

    expect(logger.calls[0]).toEqual(`?? ${file2}`);
    expect(logger.calls[1]).toEqual(`?? ${file1}`);
  });

  it('lists files as untracked if they are not in the index', () => {
    const { root } = createTempRepo();
    writeFileSync(join(root, file1), '');

    const ctx = {
      targetDir: root,
      args: [file1],
      root,
      message: 'message',
    };

    commandRunner(JitCommand.Commit, ctx);

    const logger = createConsoleLogSpy();

    writeFileSync(join(root, file2), '');
    new Status(ctx).run();

    expect(logger.calls).toEqual([`?? ${file2}`]);
  });

  it('lists untracked directories, not their contents', () => {
    const { root } = createTempRepo();
    writeFileSync(join(root, file1), '');
    mkdirSync(join(root, `dir/${file2}`), { recursive: true });

    new Init({ targetDir: root, root }).run();

    const logger = createConsoleLogSpy();

    new Status({ targetDir: root, root }).run();

    expect(logger.calls).toEqual([`?? dir/`, `?? ${file1}`]);
  });

  it('lists untracked files inside tracked directories', () => {
    const { root } = createTempRepo();

    mkdirSync(join(root, 'a/b'), { recursive: true });
    writeFileSync(join(root, 'a/b/inner.txt'), 'hello');

    const ctx = {
      targetDir: root,
      args: ['a/b/inner.txt'],
      root,
      message: 'message',
    };

    commandRunner(JitCommand.Commit, ctx);

    const logger = createConsoleLogSpy();

    writeFileSync(join(root, 'a/outer.txt'), '');
    mkdirSync(join(root, 'a/b/c'), { recursive: true });
    writeFileSync(join(root, 'a/b/c/file.txt'), '');

    new Status(ctx).run();

    expect(logger.calls).toEqual([`?? a/b/c/`, `?? a/outer.txt`]);
  });
});
