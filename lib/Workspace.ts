import {
  accessSync,
  constants,
  existsSync,
  readdirSync,
  readFileSync,
  Stats,
  statSync,
} from 'fs';
import { join, relative } from 'path';

export class MissingFile extends Error {}

export default class Workspace {
  private readonly IGNORE = ['.git'];

  constructor(private readonly rootPath: string) {}

  listFiles(path: string = this.rootPath): string[] {
    const relativePath = relative(this.rootPath, path);

    if (!existsSync(path)) {
      throw new MissingFile(`pathspec ${relativePath} did not match any files`);
    }

    if (statSync(path).isDirectory()) {
      return readdirSync(path, { withFileTypes: true })
        .filter((entry) => !this.IGNORE.includes(entry.name))
        .flatMap((entry) => this.listFiles(join(path, entry.name)));
    } else {
      return [relativePath];
    }
  }

  readFile(file: string): NonSharedBuffer {
    return readFileSync(join(this.rootPath, file));
  }

  statFile(filePath: string): Stats {
    const fullPath = join(this.rootPath, filePath);
    return statSync(fullPath);
  }

  isExecutable(path: string) {
    try {
      accessSync(path, constants.X_OK);
      return true;
    } catch {
      return false;
    }
  }
}
