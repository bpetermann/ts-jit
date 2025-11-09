import fs from 'fs';
import { join, relative } from 'path';

export default class Workspace {
  private readonly IGNORE = ['.git'];

  constructor(private readonly rootPath: string) {}

  listFiles(path: string = this.rootPath): string[] {
    if (fs.statSync(path).isDirectory()) {
      return fs
        .readdirSync(path, { withFileTypes: true })
        .filter((entry) => !this.IGNORE.includes(entry.name))
        .flatMap((entry) => {
          const fullPath = join(path, entry.name);
          return entry.isDirectory()
            ? this.listFiles(fullPath)
            : [relative(this.rootPath, fullPath)];
        });
    }

    return [relative(this.rootPath, path)];
  }

  readFile(file: string): NonSharedBuffer {
    return fs.readFileSync(join(this.rootPath, file));
  }

  statFile(filePath: string): fs.Stats {
    const fullPath = join(this.rootPath, filePath);
    return fs.statSync(fullPath);
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
