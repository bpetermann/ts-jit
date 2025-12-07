import { mkdirSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import Database from './Database.js';
import Author from './database/Author.js';
import Blob from './database/Blob.js';
import Commit from './database/Commit.js';
import Tree from './database/Tree.js';
import Index from './Index.js';
import Refs from './Refs.js';
import Workspace from './Workspace.js';

export default class Jit {
  private command?: string;
  private dir?: string;
  private args?: string[];

  constructor() {
    this.command = process.argv[2];
    this.dir = process.argv[3];
    this.args = process.argv.slice(3);
  }

  main() {
    const rootPath = process.cwd();

    switch (this.command) {
      case 'init':
        this.create(this.dir);
        break;
      case 'commit':
        this.commit(rootPath, this.tmpMessage());
        break;
      case 'add':
        this.add(rootPath, this.args);
        break;
      default:
        throw new Error(`jit: ${this.command} is not a jit command.`);
    }
  }

  add(rootPath: string, args?: string[]) {
    const gitPath = join(rootPath, '.git');
    const dbPath = join(gitPath, 'objects');
    const indexPath = join(gitPath, 'index');

    const workspace = new Workspace(rootPath);
    const database = new Database(dbPath);
    const index = new Index(indexPath);

    index.load();

    let paths: string[] = [];

    try {
      paths =
        args?.flatMap((arg) => {
          const path = resolve(rootPath, arg);
          return workspace.listFiles(path);
        }) ?? [];
    } catch (error) {
      console.error(error?.message);
    }

    try {
      paths.forEach((pathname) => {
      const data = workspace.readFile(pathname);
      const stat = workspace.statFile(pathname);

      const blob = new Blob(data);
      database.store(blob);
      index.add(pathname, blob.oid, stat);
    });
    } catch (error) {
      console.error('error:', error?.message);
      console.error('fatal: adding files failed');
      exit(128);
    }
    index.writeUpdates();
  }

  commit(rootPath: string, message: string) {
    const gitPath = join(rootPath, '.git');
    const dbPath = join(gitPath, 'objects');

    const database = new Database(dbPath);
    const index = new Index(join(gitPath, 'index'));
    const refs = new Refs(gitPath);

    index.load();

    const root = Tree.build(index.eachEntry());
    root.traverse((tree) => database.store(tree));

    const parent = refs.readHead();
    const name = process.env.GIT_AUTHOR_NAME;
    const email = process.env.GIT_AUTHOR_EMAIL;
    const author = new Author(name, email, Math.floor(Date.now() / 1000));

    const commit = new Commit(parent, root.oid!, author, message);
    database.store(commit);
    refs.updateHead(commit.oid!);

    const isRoot = !parent ? '(root-commit) ' : '';
    console.log(`[${isRoot}${root.oid}] ${message}`);
  }

  create(dir?: string) {
    const rootPath = resolve(dir ?? process.cwd());
    const gitPath = join(rootPath, '.git');

    try {
      ['objects', 'refs'].forEach((dir) =>
        mkdirSync(join(gitPath, dir), {
          recursive: true,
        })
      );

      console.log(`Initialized empty Jit repository in ${gitPath}`);
      return;
    } catch (e) {
      throw new Error(`jit: failed to create folder ${e}`);
    }
  }

  private tmpMessage(): string {
    return readFileSync(0)?.toString();
  }
}
