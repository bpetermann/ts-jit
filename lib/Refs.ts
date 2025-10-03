import fs from 'fs';
import path from 'path';

export default class Refs {
  headPath: string;
  constructor(pathname: string) {
    this.headPath = path.join(pathname, 'HEAD');
  }

  updateHead(oid: string): void {
    try {
      fs.writeFileSync(this.headPath, oid || '');
    } catch (e) {
      throw new Error(
        `jit: failed to write ID in HEAD: ${
          e instanceof Error ? e.message : String(e)
        }`
      );
    }
  }

  readHead(): NonSharedBuffer | undefined {
    if (fs.existsSync(this.headPath)) {
      return fs.readFileSync(this.headPath);
    }
  }
}
