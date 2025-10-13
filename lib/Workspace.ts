import fs from 'fs';
import path from 'path';

export default class Workspace {
  private readonly IGNORE = ['.git'];

  constructor(private readonly rootPath: string) {}

  listFiles(dir: string = this.rootPath): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    return entries
      .filter((entry) => !this.IGNORE.includes(entry.name))
      .flatMap((entry) => {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          return this.listFiles(fullPath);
        }

        return path.relative(this.rootPath, fullPath);
      });
  }

  readFile(file: string): NonSharedBuffer {
    return fs.readFileSync(path.join(this.rootPath, file));
  }

  statFile(filePath: string): fs.Stats {
    const fullPath = path.join(this.rootPath, filePath);
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
