import * as fs from 'fs';

export default class Entry {
  static REGULAR_MODE = 0o100644;
  static EXECUTABLE_MODE = 0o100755;
  static MAX_PATH_SIZE = 0xfff;
  static ENTRY_BLOCK = 8;

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
    const mode =
      (stat.mode & 0o111) !== 0 ? Entry.EXECUTABLE_MODE : Entry.REGULAR_MODE;
    const flags = Math.min(Buffer.byteLength(path), Entry.MAX_PATH_SIZE);

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
    const pad =
      (Entry.ENTRY_BLOCK - (totalSize % Entry.ENTRY_BLOCK)) % Entry.ENTRY_BLOCK;
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
}
