import { createHash } from 'crypto';
import * as fs from 'fs';
import Entry from './index/Entry.js';

export default class Index {
  public entries: Record<string, Entry> = {};
  private keys: Set<string> = new Set();

  constructor(private readonly pathname: string) {}

  add(pathname: string, oid: string, stat: fs.Stats) {
    const entry = Entry.create(pathname, oid, stat);
    this.keys.add(entry.key);
    this.entries[entry.key] = entry;
  }

  eachEntry(): Entry[] {
    return Array.from(this.keys)
      .sort((a, b) => a.localeCompare(b))
      .map((key) => this.entries[key]);
  }

  writeUpdates(): boolean {
    try {
      const buffers: Buffer[] = [];

      const header = Buffer.alloc(12);
      header.write('DIRC', 0, 4, 'ascii');
      header.writeUInt32BE(2, 4);
      const entries = this.eachEntry();
      header.writeUInt32BE(entries.length, 8);
      buffers.push(header);

      for (const entry of this.eachEntry()) buffers.push(entry.toBuffer());

      const fileBuffer = Buffer.concat(buffers);

      const hash = createHash('sha1');
      hash.update(fileBuffer);
      const checksum = hash.digest();
      const finalBuffer = Buffer.concat([fileBuffer, checksum]);

      fs.writeFileSync(this.pathname, finalBuffer);

      return true;
    } catch (err) {
      console.error('Failed to write index:', err);
      return false;
    }
  }
}
