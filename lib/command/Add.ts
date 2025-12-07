import { resolve } from 'path';
import { exit } from 'process';
import Blob from '../database/Blob.js';
import Repository from '../Repository.js';
import Base from './Base.js';

export default class Add extends Base {
  override run() {
    const { rootPath, args } = this.context;
    const repo = new Repository(rootPath);

    repo.index.load();

    let paths: string[] = [];

    try {
      paths =
        args?.flatMap((arg) => {
          const path = resolve(rootPath, arg);
          return repo.workspace.listFiles(path);
        }) ?? [];
    } catch (error) {
      console.error(error?.message);
    }

    try {
      paths.forEach((pathname) => {
        const data = repo.workspace.readFile(pathname);
        const stat = repo.workspace.statFile(pathname);

        const blob = new Blob(data);
        repo.database.store(blob);
        repo.index.add(pathname, blob.oid, stat);
      });
    } catch (error) {
      console.error('error:', error?.message);
      console.error('fatal: adding files failed');
      exit(128);
    }

    repo.index.writeUpdates();
  }
}
