import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const cleanupFns: Array<() => void> = [];

export function createTempRepo() {
  const root = mkdtempSync(join(tmpdir(), 'jit-test-'));
  cleanupFns.push(() => rmSync(root, { recursive: true, force: true }));
  return { root };
}

export function runCleanup() {
  cleanupFns.forEach((fn) => fn());
  cleanupFns.length = 0;
}
