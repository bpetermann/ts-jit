import { readFileSync } from 'fs';
import Repository from 'lib/Repository.js';
import Author from '../database/Author.js';
import CommitData from '../database/Commit.js';
import Tree from '../database/Tree.js';
import Base from './Base.js';

export default class Commit extends Base {
  override run() {
    const { rootPath } = this.context;
    const message = this.context.message ?? this.readMessageFromStdin();

    const repo = new Repository(rootPath);

    repo.index.load();

    const root = Tree.build(repo.index.eachEntry());
    root.traverse((tree) => repo.database.store(tree));

    const parent = repo.refs.readHead();
    const name = process.env.GIT_AUTHOR_NAME;
    const email = process.env.GIT_AUTHOR_EMAIL;
    const author = new Author(name, email, Math.floor(Date.now() / 1000));

    const commit = new CommitData(parent, root.oid!, author, message);
    repo.database.store(commit);
    repo.refs.updateHead(commit.oid!);

    const isRoot = !parent ? '(root-commit) ' : '';
    console.log(`[${isRoot}${root.oid}] ${message}`);
  }

  private readMessageFromStdin(): string {
    return readFileSync(0)?.toString();
  }
}
