import fs from 'fs';
import path from 'path';

export default class Workspace {
  constructor(private readonly path: string) {}

  listFiles(): Array<string> {
    return fs
      .readdirSync(this.path, { withFileTypes: true })
      .filter((item) => !item.isDirectory())
      .map((item) => item.name);
  }

  readFile(file: string): NonSharedBuffer {
    return fs.readFileSync(path.join(this.path, file));
  }

  statFile(path: string): boolean {
    return this.isExecutable(path);
  }

  isExecutable(path: string) {
    try {
      fs.accessSync(path, fs.constants.X_OK);
      return true;
    } catch {
      return false;
    }
  }
}
