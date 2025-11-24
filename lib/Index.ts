import { createHash } from 'crypto';
import { Stats, openSync, writeFileSync } from 'fs';
import Checksum from './index/Checksum.js';
import Entry from './index/Entry.js';

const HEADER_SIZE = 12;
const SIGNATURE = 'DIRC';
const VERSION = 2;
const ENTRY_MIN_SIZE = 64;
const ENTRY_BLOCK = 8;

export default class Index {
  public entries: Record<string, Entry> = {};
  private keys: Set<string> = new Set();
  private parents: Record<string, Set<string>> = {};
  private changed: boolean = false;

  constructor(private readonly pathname: string) {
    this.clear();
  }

  add(pathname: string, oid: string, stat: Stats) {
    const entry = Entry.create(pathname, oid, stat);
    this.discardConflicts(entry);
    this.storeEntry(entry);
    this.changed = true;
  }

  eachEntry(): Array<Entry> {
    return Array.from(this.keys)
      .sort((a, b) => a.localeCompare(b))
      .map((key) => this.entries[key]);
  }

  load(): void {
    this.clear();

    const file = this.openIndexFile();

    if (file) {
      const reader = new Checksum(file);
      const count = this.readHeader(reader);
      this.readEntries(reader, count);
      reader.verifyChecksum();
    }
  }

  readEntries(reader: Checksum, count: number): void {
    for (let i = 0; i < count; i++) {
      let entry = Buffer.from(reader.read(ENTRY_MIN_SIZE));

      while (entry[entry.length - 1] !== 0x00) {
        entry = Buffer.concat([entry, reader.read(ENTRY_BLOCK)]);
      }

      this.storeEntry(Entry.parse(entry));
    }
  }

  storeEntry(entry: Entry) {
    this.keys.add(entry.key);
    this.entries[entry.key] = entry;

    entry.parentDirectories().forEach((dirname) => {
      if (!this.parents[dirname]) this.parents[dirname] = new Set();
      this.parents[dirname].add(entry.path);
    });
  }

  readHeader(reader: Checksum): number {
    const data = reader.read(HEADER_SIZE);

    const signature = data.subarray(0, 4).toString('ascii');
    const version = data.readUInt32BE(4);
    const count = data.readUInt32BE(8);

    if (signature !== SIGNATURE) {
      throw new Error(
        `Signature: expected '${SIGNATURE}' but found '${signature}'`
      );
    }

    if (version !== VERSION) {
      throw new Error(`Version: expected '${VERSION}' but found '${version}'`);
    }

    return count;
  }

  writeUpdates(): void {
    if (this.changed) {
      try {
        const buffers: Buffer[] = [];

        const header = Buffer.alloc(12);
        header.write(SIGNATURE, 0, 4, 'ascii');
        header.writeUInt32BE(2, 4);

        const entries = this.eachEntry();
        header.writeUInt32BE(entries.length, 8);
        buffers.push(header);

        for (const entry of entries) buffers.push(entry.toBuffer());

        const fileBuffer = Buffer.concat(buffers);
        const checksum = createHash('sha1').update(fileBuffer).digest();

        const finalBuffer = Buffer.concat([fileBuffer, checksum]);
        writeFileSync(this.pathname, finalBuffer);

        this.changed = false;
      } catch (err) {
        console.error('Failed to write index:', err);
      }
    }
  }

  private clear(): void {
    this.entries = {};
    this.keys = new Set();
    this.parents = {};
    this.changed = false;
  }

  private openIndexFile(): number | null {
    try {
      return openSync(this.pathname, 'r');
    } catch {
      return null;
    }
  }

  private discardConflicts(entry: Entry) {
    entry.parentDirectories().forEach((parent) => this.removeEntry(parent));
    this.removeChildren(entry.path);
  }

  private removeChildren(path: string): void {
    Array.from(this.parents[path] ?? []).forEach((child) =>
      this.removeEntry(child)
    );
  }

  private removeEntry(pathname: string): void {
    const entry = this.entries[pathname];
    if (!entry) return;

    this.keys.delete(pathname);
    delete this.entries[pathname];

    entry.parentDirectories().forEach((dir) => {
      const set = this.parents[dir];
      if (set) {
        set.delete(entry.path);
        if (set.size === 0) delete this.parents[dir];
      }
    });
  }
}
