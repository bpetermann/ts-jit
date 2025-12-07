import { join } from 'path';
import Database from './Database.js';
import Index from './Index.js';
import Refs from './Refs.js';
import Workspace from './Workspace.js';

export default class Repository {
  gitPath: string;

  _database: Database | null = null;
  _index: Index | null = null;
  _refs: Refs | null = null;
  _workspace: Workspace | null = null;

  constructor(private readonly rootPath: string) {
    this.gitPath = join(rootPath, '.git');
  }

  get database(): Database {
    if (!this._database)
      this._database = new Database(join(this.gitPath, 'objects'));
    return this._database;
  }

  get index(): Index {
    if (!this._index) this._index = new Index(join(this.gitPath, 'index'));
    return this._index;
  }

  get refs(): Refs {
    if (!this._refs) this._refs = new Refs(this.gitPath);
    return this._refs;
  }

  get workspace(): Workspace {
    if (!this._workspace) this._workspace = new Workspace(this.rootPath);
    return this._workspace;
  }
}
