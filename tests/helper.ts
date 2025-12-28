import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from 'fs';
import Add from 'lib/command/Add.js';
import Base, { CommandContext } from 'lib/command/Base.js';
import Commit from 'lib/command/Commit.js';
import Init from 'lib/command/Init.js';
import Index from 'lib/Index.js';
import { JitCommand } from 'lib/types/JitCommand.js';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import { expect, vi } from 'vitest';

const cleanupFns: Array<() => void> = [];

interface TempRepoConfig {
  cleanup?: boolean;
}

export function createTempRepo(
  { cleanup }: TempRepoConfig = { cleanup: true }
) {
  const root = mkdtempSync(join(tmpdir(), 'jit-test-'));
  const gitIndex = join(root, '.git', 'index');
  if (cleanup) {
    cleanupFns.push(() => rmSync(root, { recursive: true, force: true }));
  }
  return { root, gitIndex };
}

export function runCleanup() {
  cleanupFns.forEach((fn) => fn());
  cleanupFns.length = 0;
}

export function assertIndex(file: string, expected: string[]) {
  const index = new Index(file);
  index.load();
  const filesInIndex = index.eachEntry().map((entry) => entry.path);
  expect(filesInIndex).toEqual(expect.arrayContaining(expected));
}

export function createConsoleLogSpy() {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  cleanupFns.push(() => spy.mockRestore());
  return {
    spy,
    get calls() {
      return spy.mock.calls.map((call) => call[0]);
    },
  };
}

export function commandRunner(
  cmd: JitCommand.Init,
  ctx: Omit<CommandContext, 'message' | 'args'>
): void;

export function commandRunner(
  cmd: JitCommand.Add,
  ctx: Omit<CommandContext, 'message'>
): void;

export function commandRunner(
  cmd: JitCommand.Commit,
  ctx: Required<CommandContext>
): void;

export function commandRunner(cmd: JitCommand, ctx: CommandContext): void {
  const chain: Record<JitCommand, Array<new (args: CommandContext) => Base>> = {
    [JitCommand.Init]: [Init],
    [JitCommand.Add]: [Init, Add],
    [JitCommand.Commit]: [Init, Add, Commit],
    [JitCommand.Status]: [],
  };
  for (const Step of chain[cmd]) new Step(ctx).run();
}

export function createRepoWithCommit(
  files: Record<string, string>,
  config?: TempRepoConfig
) {
  const { root } = createTempRepo(config);

  commandRunner(JitCommand.Init, {
    targetDir: root,
    root,
  });

  for (const [path, content] of Object.entries(files)) {
    const fullPath = join(root, path);
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, content);
  }

  commandRunner(JitCommand.Commit, {
    targetDir: root,
    args: ['.'],
    root,
    message: 'commit message',
  });

  return root;
}

export function touchSync(filePath: string) {
  const now = new Date();

  try {
    utimesSync(filePath, now, now);
  } catch {
    writeFileSync(filePath, '');
  }
}
