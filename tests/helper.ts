import { mkdtempSync, rmSync } from 'fs';
import Index from 'lib/Index.js';
import { tmpdir } from 'os';
import { join } from 'path';
import { expect, vi } from 'vitest';

const cleanupFns: Array<() => void> = [];

export function createTempRepo() {
  const root = mkdtempSync(join(tmpdir(), 'jit-test-'));
  const gitIndex = join(root, '.git', 'index');
  cleanupFns.push(() => rmSync(root, { recursive: true, force: true }));
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
