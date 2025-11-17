import { createHash } from 'crypto';
import * as fs from 'fs';
import Checksum from './Checksum.js';
import Entry from './index/Entry.js';

const HEADER_SIZE = 12;
const SIGNATURE = 'DIRC';
const VERSION = 2;
const ENTRY_MIN_SIZE = 64;
const ENTRY_BLOCK = 8;
export default class Index {
  public entries: Record<string, Entry> = {};
  private keys: Set<string> = new Set();
  private changed: boolean = false;

  constructor(private readonly pathname: string) {}

  add(pathname: string, oid: string, stat: fs.Stats) {
    const entry = Entry.create(pathname, oid, stat);
    this.storeEntry(entry);
    this.changed = true;
  }

  eachEntry(): Array<Entry> {
    return Array.from(this.keys)
      .sort((a, b) => a.localeCompare(b))
      .map((key) => this.entries[key]);
  }

  loadForUpdate(): void {
    this.clear();

    const file = this.openIndexFile();

    if (file) {
      const reader = new Checksum(file);
      const count = this.readHeader(reader);
      this.readEntries(reader, count);
      reader.verifyChecksum();
    }
  }

  readEntries(reader: Checksum, count: number) {
    for (let i = 0; i < count; i++) {
      let entry = Buffer.from(reader.read(ENTRY_MIN_SIZE));

      while (entry[entry.length - 1] !== 0x00) {
        const extra = reader.read(ENTRY_BLOCK);
        entry = Buffer.concat([entry, extra]);
      }

      const parsed = Entry.parse(entry);
      this.storeEntry(parsed);
    }
  }

  storeEntry(entry: Entry) {
    this.keys.add(entry.key);
    this.entries[entry.key] = entry;
  }

  readHeader(reader: Checksum): number {
    const data = reader.read(HEADER_SIZE);

    const signature = data.slice(0, 4).toString('ascii');

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

  private clear(): void {
    this.entries = {};
    this.keys = new Set();
    this.changed = false;
  }

  private openIndexFile(): number | null {
    try {
      return fs.openSync(this.pathname, 'r');
    } catch {
      return null;
    }
  }

  writeUpdates(): boolean {
    if (!this.changed) return true;
    try {
      const buffers: Buffer[] = [];

      const header = Buffer.alloc(12);
      header.write('DIRC', 0, 4, 'ascii');
      header.writeUInt32BE(2, 4);
      const entries = this.eachEntry();
      header.writeUInt32BE(entries.length, 8);
      buffers.push(header);

      for (const entry of entries) buffers.push(entry.toBuffer());

      const fileBuffer = Buffer.concat(buffers);
      const checksum = createHash('sha1').update(fileBuffer).digest();

      const finalBuffer = Buffer.concat([fileBuffer, checksum]);
      fs.writeFileSync(this.pathname, finalBuffer);

      this.changed = false;

      return true;
    } catch (err) {
      console.error('Failed to write index:', err);
      return false;
    }
  }
}
