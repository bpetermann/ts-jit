import { createHash } from 'crypto';
import { readSync } from 'fs';
import { EndOfFile, InvalidChecksum } from '../errors/index.js';

const CHECKSUM = 20;

export default class Checksum {
  private fd: number;
  private digest = createHash('sha1');
  private offset = 0;

  constructor(fd: number) {
    this.fd = fd;
  }

  read(size: number): Buffer {
    const buffer = Buffer.alloc(size);
    const bytesRead = readSync(this.fd, buffer, 0, size, this.offset);

    if (bytesRead !== size) {
      throw new EndOfFile('Unexpected end-of-file while reading index');
    }

    this.offset += size;
    this.digest.update(buffer);

    return buffer;
  }

  verifyChecksum(): void {
    const buffer = Buffer.alloc(CHECKSUM);
    const bytesRead = readSync(this.fd, buffer, 0, CHECKSUM, this.offset);

    if (bytesRead !== CHECKSUM) {
      throw new EndOfFile('Unexpected end-of-file while reading checksum');
    }

    const calculated = this.digest.digest();

    if (!buffer.equals(calculated)) {
      throw new InvalidChecksum('Checksum does not match value stored on disk');
    }
  }
}
