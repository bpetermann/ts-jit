import { writeFileSync } from 'fs';
import Init from 'lib/command/Init.js';
import Status from 'lib/command/Status.js';
import { join } from 'path';
import { describe, expect, test } from 'vitest';
import { createConsoleLogSpy, createTempRepo } from './helper.js';

describe('Status', () => {
  test('lists untracked files in name order', () => {
    const file1 = 'file.txt';
    const file2 = 'another.txt';

    const { root } = createTempRepo();
    const logger = createConsoleLogSpy();

    new Init({ targetDir: root, root }).run();

    writeFileSync(join(root, file1), '');
    writeFileSync(join(root, file2), '');

    new Status({ targetDir: root, root }).run();

    expect(logger.calls[1]).toEqual(`?? ${file2}`);
    expect(logger.calls[2]).toEqual(`?? ${file1}`);
  });
});
