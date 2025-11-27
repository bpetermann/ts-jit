import { Stats, statSync } from 'fs';
import Index from 'lib/Index.js';
import Entry from 'lib/index/Entry.js';
import { beforeEach, describe, expect, test } from 'vitest';
import { createTempRepo } from './helper.js';

const getPath = ({ path }: Entry): string => path;

describe('Index', () => {
  let root: string;
  let stat: Stats;
  let oid: string;
  let index: Index;

  beforeEach(() => {
    const tmp = createTempRepo();
    root = tmp.root;
    stat = statSync(root);
    oid = Math.random().toString();
    index = new Index(root);
  });

  test('adds a single file', () => {
    index.add('alice.txt', oid, stat);

    const paths = index.eachEntry().map(getPath);

    expect(paths).toEqual(['alice.txt']);
  });

  test('replace a file with a directory', () => {
    index.add('alice.txt', oid, stat);
    index.add('bob.txt', oid, stat);
    index.add('alice.txt/nested.txt', oid, stat);

    const paths = index.eachEntry().map(getPath);

    expect(paths).toEqual(['alice.txt/nested.txt', 'bob.txt']);
  });

  test('replaces a directory with a file', () => {
    index.add('alice.txt', oid, stat);
    index.add('nested/bob.txt', oid, stat);

    index.add('nested', oid, stat);

    const paths = index.eachEntry().map(getPath);

    expect(paths).toEqual(['alice.txt', 'nested']);
  });

  test('recursively replaces a directory with a file', () => {
    index.add('alice.txt', oid, stat);
    index.add('nested/bob.txt', oid, stat);
    index.add('nested/inner/claire.txt', oid, stat);

    index.add('nested', oid, stat);

    const paths = index.eachEntry().map(getPath);
    expect(paths).toEqual(['alice.txt', 'nested']);
  });
});
