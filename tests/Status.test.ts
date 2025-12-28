import { chmodSync, mkdirSync, rmdirSync, rmSync, writeFileSync } from 'fs';
import Init from 'lib/command/Init.js';
import Status from 'lib/command/Status.js';
import { JitCommand } from 'lib/types/JitCommand.js';
import { join } from 'path';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  commandRunner,
  createConsoleLogSpy,
  createRepoWithCommit,
  createTempRepo,
  touchSync,
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
    mkdirSync(join(root, `dir`), { recursive: true });
    writeFileSync(join(root, `dir/${file2}`), '');

    commandRunner(JitCommand.Init, {
      targetDir: root,
      root,
    });

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

  it('does not list empty untracked directories', () => {
    const { root } = createTempRepo();

    mkdirSync(join(root, `outer`));

    new Init({ targetDir: root, root }).run();

    const logger = createConsoleLogSpy();

    new Status({ targetDir: root, root }).run();

    expect(logger.calls).toEqual([]);
  });

  it('lists untracked directories that indirectly contain files', () => {
    const { root } = createTempRepo();

    mkdirSync(join(root, 'outer/inner'), { recursive: true });
    writeFileSync(join(root, 'outer/inner/file.txt'), '');

    new Init({ targetDir: root, root }).run();

    const logger = createConsoleLogSpy();

    new Status({ targetDir: root, root }).run();

    expect(logger.calls).toEqual([`?? outer/`]);
  });
});

describe('Status', () => {
  let rootPath: string;

  beforeEach(() => {
    rootPath = createRepoWithCommit({
      '1.txt': 'one',
      'a/2.txt': 'two',
      'a/b/3.txt': 'three',
    });
  });

  it('prints nothing when no files are changed', () => {
    const logger = createConsoleLogSpy();

    new Status({ root: rootPath }).run();

    expect(logger.calls).toEqual([]);
  });

  it('reports files with modified contents', () => {
    writeFileSync(join(rootPath, '1.txt'), 'changed');
    writeFileSync(join(rootPath, 'a/2.txt'), 'modified');

    const logger = createConsoleLogSpy();

    new Status({ root: rootPath }).run();

    expect(logger.calls).toEqual([' M 1.txt', ' M a/2.txt']);
  });

  it('reports files with changed modes', () => {
    chmodSync(join(rootPath, 'a/2.txt'), 0o755);

    const logger = createConsoleLogSpy();

    new Status({ root: rootPath }).run();

    expect(logger.calls).toEqual([' M a/2.txt']);
  });

  it('reports modified files with unchanged size', () => {
    writeFileSync(join(rootPath, 'a/b/3.txt'), 'hello');

    const logger = createConsoleLogSpy();

    new Status({ root: rootPath }).run();

    expect(logger.calls).toEqual([' M a/b/3.txt']);
  });

  it('prints nothing if a file is touched', () => {
    touchSync(join(rootPath, '1.txt'));

    const logger = createConsoleLogSpy();

    new Status({ root: rootPath }).run();

    expect(logger.calls).toEqual([]);
  });

  it('reports deleted files', () => {
    rmSync(join(rootPath, 'a/2.txt'));

    const logger = createConsoleLogSpy();

    new Status({ root: rootPath }).run();

    expect(logger.calls).toEqual([' D a/2.txt']);
  });

  it('reports files in deleted directories', () => {
    rmdirSync(join(rootPath, 'a'), { recursive: true });

    const logger = createConsoleLogSpy();

    new Status({ root: rootPath }).run();

    expect(logger.calls).toEqual([' D a/2.txt', ' D a/b/3.txt']);
  });
});
