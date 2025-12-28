import { Stats } from 'node:fs';
import Blob from '../database/Blob.js';
import Entry from '../index/Entry.js';
import Base from './Base.js';

const DELETED = ':workspace_deleted' as const;
const MODIFIED = ':workspace_modified' as const;

export default class Status extends Base {
  stats: Record<string, Stats> = {};
  changed: string[] = [];
  changes: Map<string, Set<string>> = new Map();
  untracked: string[] = [];

  override run() {
    this.repo.index.load();

    this.scanWorkspace();
    this.detectWorkspaceChanges();

    this.repo.index.writeUpdates();

    this.printResults();
  }

  private printResults() {
    this.changed.forEach((path) =>
      console.log(`${this.statusFor(path)} ${path}`)
    );
    this.untracked.forEach((path) => console.log(`?? ${path}`));
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

    if (!stat) {
      this.recordChange(entry.path, DELETED);
      return;
    }

    if (!entry.statMatch(stat)) {
      this.recordChange(entry.path, MODIFIED);
      return;
    }

    if (entry.timesMatch(stat)) return;

    const data = this.repo.workspace.readFile(entry.path);
    const blob = new Blob(data);
    const oid = this.repo.database.hashObject(blob);

    if (entry.oid === oid) {
      this.repo.index.updateEntryStat(entry, stat);
    } else {
      this.recordChange(entry.path, MODIFIED);
    }
  };

  private recordChange(path: string, type: string): void {
    this.changed.push(path);

    if (!this.changes.has(path)) {
      this.changes.set(path, new Set([type]));
    } else {
      this.changes.get(path)?.add(type);
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

  private statusFor(path: string): string {
    const changes = this.changes.get(path);

    let status: string = '';

    if (changes?.has(DELETED)) status = ' D';
    if (changes?.has(MODIFIED)) status = ' M';

    return status;
  }
}
