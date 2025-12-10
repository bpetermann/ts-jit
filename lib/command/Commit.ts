import { readFileSync } from 'fs';
import Author from '../database/Author.js';
import CommitData from '../database/Commit.js';
import Tree from '../database/Tree.js';
import Base from './Base.js';

export default class Commit extends Base {
  override run() {
    const message = this.context.message ?? this.readMessageFromStdin();

    this.repo.index.load();

    const root = Tree.build(this.repo.index.eachEntry());
    root.traverse((tree) => this.repo.database.store(tree));

    const parent = this.repo.refs.readHead();
    const name = process.env.GIT_AUTHOR_NAME;
    const email = process.env.GIT_AUTHOR_EMAIL;
    const author = new Author(name, email, Math.floor(Date.now() / 1000));

    const commit = new CommitData(parent, root.oid!, author, message);
    this.repo.database.store(commit);
    this.repo.refs.updateHead(commit.oid!);

    const isRoot = !parent ? '(root-commit) ' : '';
    console.log(`[${isRoot}${root.oid}] ${message}`);
  }

  private readMessageFromStdin(): string {
    return readFileSync(0)?.toString();
  }
}
