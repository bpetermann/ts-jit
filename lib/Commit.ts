import Author from './Author.js';
import { JitObject } from './JitObject.js';

export default class Commit implements JitObject {
  private _oid: string | undefined;

  constructor(
    private parent: NonSharedBuffer | undefined,
    private tree: string,
    private author: Author,
    private message: string
  ) {}

  get oid(): string | undefined {
    return this._oid;
  }

  set oid(id: string) {
    this._oid = id;
  }

  type(): string {
    return 'commit';
  }

  toString(): string {
    return [
      `tree ${this.tree}`,
      ...(this.parent ? [`parent ${this.parent}`] : []),
      `author ${this.author.toString()}`,
      `committer ${this.author.toString()}`,
      '',
      this.message,
    ].join('\n');
  }
}
