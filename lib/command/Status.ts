import { Stats } from 'node:fs';
import Blob from '../database/Blob.js';
import Entry from '../index/Entry.js';
import Base from './Base.js';

export default class Status extends Base {
  stats: Record<string, Stats> = {};
  changed: string[] = [];
  untracked: string[] = [];

  override run() {
    this.repo.index.load();

    this.scanWorkspace();
    this.detectWorkspaceChanges();

    this.repo.index.writeUpdates();

    this.changed.forEach((file) => console.log(` M ${file}`));
    this.untracked.forEach((file) => console.log(`?? ${file}`));
  }

  private scanWorkspace(prefix: string = ''): void {
    const entries = this.repo.workspace.listDir(prefix);

    for (const [path, stat] of Object.entries(entries)) {
      if (this.repo.index.tracked(path)) {
        if (stat.isFile()) this.stats[path] = stat;
        if (stat.isDirectory()) this.scanWorkspace(path);
      } else if (this.trackableFile(path, stat)) {
        const displayPath = stat.isDirectory() ? `${path}/` : path;
        this.untracked.push(displayPath);
      }
    }
  }

  private detectWorkspaceChanges(): void {
    this.repo.index.eachEntry().forEach(this.checkIndexEntry);
  }

  private checkIndexEntry = (entry: Entry): void => {
    const stat = this.stats[entry.path];

    if (stat && !entry.statMatch(stat)) {
      this.changed.push(entry.path);
      return;
    }

    if (entry.timesMatch(stat)) return;

    const data = this.repo.workspace.readFile(entry.path);
    const blob = new Blob(data);
    const oid = this.repo.database.hashObject(blob);

    if (entry.oid === oid) {
      this.repo.index.updateEntryStat(entry, stat);
    } else {
      this.changed.push(entry.path);
    }
  };

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
