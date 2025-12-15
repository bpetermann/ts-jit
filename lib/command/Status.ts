import { Stats } from 'node:fs';
import Base from './Base.js';

export default class Status extends Base {
  untracked: string[] = [];

  override run() {
    this.repo.index.load();

    this.scanWorkspace();

    this.untracked.forEach((file) => console.log(`?? ${file}`));
  }

  private scanWorkspace(prefix: string = ''): void {
    const entries = this.repo.workspace.listDir(prefix);

    for (const [path, stat] of Object.entries(entries)) {
      if (this.repo.index.tracked(path)) {
        if (stat.isDirectory()) {
          this.scanWorkspace(path);
        }
      } else if (this.trackableFile(path, stat)) {
        const displayPath = stat.isDirectory() ? `${path}/` : path;
        this.untracked.push(displayPath);
      }
    }
  }

  private trackableFile(path: string, stat: Stats): boolean {
    if (!stat) return false;

    if (stat.isFile()) {
      return !this.repo.index.tracked(path);
    }

    if (!stat.isDirectory()) return false;

    const items = this.repo.workspace.listDir(path);

    return Object.entries(items).some(([childPath, childStat]) =>
      this.trackableFile(childPath, childStat)
    );
  }
}
