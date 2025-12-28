import * as fs from 'fs';
import JitEntry from 'lib/types/JitEntry.js';
import pathModule from 'path';

const REGULAR_MODE = 0o100644;
const EXECUTABLE_MODE = 0o100755;
const MAX_PATH_SIZE = 0xfff;
const ENTRY_BLOCK = 8;

export default class Entry implements JitEntry {
  constructor(
    public ctime: number,
    public ctime_nsec: number,
    public mtime: number,
    public mtime_nsec: number,
    public dev: number,
    public ino: number,
    public mode: number,
    public uid: number,
    public gid: number,
    public size: number,
    public oid: string,
    public flags: number,
    public path: string
  ) {}

  static create(pathname: string, oid: string, stat: fs.Stats) {
    const path = pathname.toString();
    const mode = Entry.modeForStat(stat);
    const flags = Math.min(Buffer.byteLength(path), MAX_PATH_SIZE);

    return new Entry(
      Math.floor(stat.ctime.getTime() / 1000),
      Math.floor((stat.ctimeMs % 1000) * 1_000_000),
      Math.floor(stat.mtime.getTime() / 1000),
      Math.floor((stat.mtimeMs % 1000) * 1_000_000),
      stat.dev,
      stat.ino,
      mode,
      stat.uid,
      stat.gid,
      stat.size,
      oid,
      flags,
      path
    );
  }

  get key(): string {
    return this.path;
  }

  toBuffer(): Buffer {
    const pathBuffer = Buffer.from(this.path, 'utf8');
    const oidBuffer = Buffer.from(this.oid, 'hex');

    const headerSize = 4 * 10 + 20 + 2;
    const totalSize = headerSize + pathBuffer.length + 1;
    const pad = (ENTRY_BLOCK - (totalSize % ENTRY_BLOCK)) % ENTRY_BLOCK;
    const paddedSize = totalSize + pad;

    const buffer = Buffer.alloc(paddedSize);
    let offset = 0;

    const writeUInt32BE = (num: number) => {
      buffer.writeUInt32BE(num, offset);
      offset += 4;
    };

    writeUInt32BE(this.ctime);
    writeUInt32BE(this.ctime_nsec);
    writeUInt32BE(this.mtime);
    writeUInt32BE(this.mtime_nsec);
    writeUInt32BE(this.dev);
    writeUInt32BE(this.ino);
    writeUInt32BE(this.mode);
    writeUInt32BE(this.uid);
    writeUInt32BE(this.gid);
    writeUInt32BE(this.size);

    oidBuffer.copy(buffer, offset);
    offset += 20;

    buffer.writeUInt16BE(this.flags, offset);
    offset += 2;

    pathBuffer.copy(buffer, offset);
    offset += pathBuffer.length;

    buffer[offset++] = 0;

    while (offset < paddedSize) buffer[offset++] = 0;

    return buffer;
  }

  static parse(buf: Buffer): Entry {
    let offset = 0;
    const read32 = () => {
      const v = buf.readUInt32BE(offset);
      offset += 4;
      return v;
    };

    const ctime = read32();
    const ctime_nsec = read32();
    const mtime = read32();
    const mtime_nsec = read32();
    const dev = read32();
    const ino = read32();
    const mode = read32();
    const uid = read32();
    const gid = read32();
    const size = read32();

    const oid = buf.slice(offset, offset + 20).toString('hex');
    offset += 20;

    const flags = buf.readUInt16BE(offset);
    offset += 2;

    const end = buf.indexOf(0x00, offset);
    if (end === -1) throw new Error('Path not null-terminated');

    const path = buf.slice(offset, end).toString('utf8');

    return new Entry(
      ctime,
      ctime_nsec,
      mtime,
      mtime_nsec,
      dev,
      ino,
      mode,
      uid,
      gid,
      size,
      oid,
      flags,
      path
    );
  }

  get basename(): string {
    return pathModule.basename(this.path);
  }

  parentDirectories(): string[] {
    const parts = this.path.split(pathModule.sep);
    const result: string[] = [];
    for (let i = 0; i < parts.length - 1; i++) {
      result.push(parts.slice(0, i + 1).join(pathModule.sep));
    }
    return result;
  }

  statMatch(stat: fs.Stats): boolean {
    return (
      this.mode === Entry.modeForStat(stat) &&
      (this.size === 0 || this.size === stat.size)
    );
  }

  static modeForStat(stat: fs.Stats): number {
    return (stat.mode & 0o111) !== 0 ? EXECUTABLE_MODE : REGULAR_MODE;
  }
}
