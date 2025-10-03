import crypto from 'crypto';
import fs from 'fs';
import { deflateSync } from 'node:zlib';
import path from 'path';
import Blob from './Blob.js';
import Commit from './Commit.js';
import Tree from './Tree.js';

export default class Database {
  private tempChars =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');

  constructor(private readonly path: string) {}

  store(object: Blob | Tree | Commit) {
    const contentBuffer = this.getBuffer(object);

    const header = Buffer.from(
      `${object.type()} ${contentBuffer.length}\0`,
      'utf8'
    );

    const storeBuffer = Buffer.concat([header, contentBuffer]);

    object.oid = crypto.createHash('sha1').update(storeBuffer).digest('hex');
    this.writeObject(object.oid, storeBuffer);
  }

  private writeObject(oid: string, storeBuffer: Buffer): void {
    const dirname = path.join(this.path, oid.slice(0, 2));
    const objPath = path.join(dirname, oid.slice(2));
    const tempPath = path.join(dirname, this.generateTempName());

    const compressed = deflateSync(storeBuffer);

    if (fs.existsSync(objPath)) return;

    try {
      fs.mkdirSync(dirname, { recursive: true });
      fs.writeFileSync(tempPath, compressed);
      fs.renameSync(tempPath, objPath);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`writeObject failed for ${oid}: ${msg}`);
    }
  }

  private getBuffer(object: Blob | Tree | Commit) {
    return object instanceof Tree
      ? object.toBuffer()
      : Buffer.from(object.toString(), 'utf8');
  }

  generateTempName() {
    return `tmp_obj_${Array(6)
      .fill(undefined)
      .map(
        (_) => this.tempChars[Math.floor(Math.random() * this.tempChars.length)]
      )
      .join('')}`;
  }
}
