import { createHash } from 'crypto';
import * as fs from 'fs';

export class EndOfFile extends Error {}
export class InvalidChecksum extends Error {}

export default class Checksum {
  private fd: number;
  private digest = createHash('sha1');
  private offset = 0;
  static CHECKSUM_SIZE = 20;

  constructor(fd: number) {
    this.fd = fd;
  }

  read(size: number): Buffer {
    const buffer = Buffer.alloc(size);
    const bytesRead = fs.readSync(this.fd, buffer, 0, size, this.offset);

    if (bytesRead !== size) {
      throw new EndOfFile('Unexpected end-of-file while reading index');
    }

    this.offset += size;
    this.digest.update(buffer);

    return buffer;
  }

  verifyChecksum(): void {
    const buffer = Buffer.alloc(Checksum.CHECKSUM_SIZE);
    const bytesRead = fs.readSync(
      this.fd,
      buffer,
      0,
      Checksum.CHECKSUM_SIZE,
      this.offset
    );

    if (bytesRead !== Checksum.CHECKSUM_SIZE) {
      throw new EndOfFile('Unexpected end-of-file while reading checksum');
    }

    const calculated = this.digest.digest();

    if (!buffer.equals(calculated)) {
      throw new InvalidChecksum('Checksum does not match value stored on disk');
    }
  }
}
