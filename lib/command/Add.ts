import { resolve } from 'path';
import Blob from '../database/Blob.js';

import { ExitError } from '../errors/index.js';
import Repository from '../Repository.js';
import Base from './Base.js';

export default class Add extends Base {
  override run() {
    const { root, args } = this.context;

    this.repo.index.load();

    const paths = this.getPaths(args, this.repo, root);

    this.addPaths(paths, this.repo);

    this.repo.index.writeUpdates();
  }

  private getPaths(
    args: string[] | undefined,
    repo: Repository,
    root: string
  ): string[] {
    try {
      return (
        args?.flatMap((arg) => {
          const path = resolve(root, arg);
          return repo.workspace.listFiles(path);
        }) ?? []
      );
    } catch (err) {
      throw new Error(`fatal: ${err instanceof Error ? err.message : ''}`);
    }
  }

  private addPaths(paths: string[], repo: Repository) {
    try {
      paths.forEach((pathname) => {
        const data = repo.workspace.readFile(pathname);
        const stat = repo.workspace.statFile(pathname);

        const blob = new Blob(data);
        repo.database.store(blob);
        repo.index.add(pathname, blob.oid, stat);
      });
    } catch (error) {
      throw new ExitError(
        `error: ${error?.message}\nfatal: adding files failed`,
        128
      );
    }
  }
}
