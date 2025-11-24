import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

export default class Refs {
  headPath: string;
  constructor(pathname: string) {
    this.headPath = path.join(pathname, 'HEAD');
  }

  updateHead(oid: string): void {
    try {
      writeFileSync(this.headPath, oid || '');
    } catch (e) {
      throw new Error(
        `jit: failed to write ID in HEAD: ${
          e instanceof Error ? e.message : String(e)
        }`
      );
    }
  }

  readHead(): NonSharedBuffer | undefined {
    if (existsSync(this.headPath)) {
      return readFileSync(this.headPath);
    }
  }
}
