import Entry from './Entry';
import { JitObject } from './JitObject';

type TreeEntry = Entry | Tree;

export default class Tree implements JitObject {
  private _oid: string | undefined;
  private readonly DIRECTORY_MODE = '40000';
  public entries: Record<string, TreeEntry> = {};

  constructor() {}

  static build(entries: Array<Entry>) {
    const sortedEntries = entries.sort((a, b) =>
      a.name.toString().localeCompare(b.name.toString())
    );

    const tree = new Tree();

    sortedEntries.forEach((entry) =>
      tree.addEntry(entry.descendUntilLast(), entry)
    );

    return tree;
  }

  get oid(): string | undefined {
    return this._oid;
  }

  get mode(): string {
    return this.DIRECTORY_MODE;
  }

  set oid(id: string) {
    this._oid = id;
  }

  type(): string {
    return 'tree';
  }

  addEntry(parents: string[], entry: Entry): void {
    if (parents.length === 0) {
      this.entries[entry.basename] = entry;
    } else {
      const dir = parents[0];
      if (!(this.entries[dir] instanceof Tree)) {
        this.entries[dir] = new Tree();
      }
      (this.entries[dir] as Tree).addEntry(parents.slice(1), entry);
    }
  }

  traverse(cb: (tree: Tree) => void): void {
    Object.values(this.entries).forEach((entry) => {
      if (entry instanceof Tree) entry.traverse(cb);
    });

    cb(this);
  }

  toBuffer(): Buffer {
    const buffers: Buffer[] = Object.entries(this.entries).map(
      ([name, entry]) => {
        const modeAndName = Buffer.from(`${entry.mode} ${name}\0`, 'utf8');
        const oidBuffer = Buffer.from(entry.oid!, 'hex');
        return Buffer.concat([modeAndName, oidBuffer]);
      }
    );
    return Buffer.concat(buffers);
  }

  toString(): string {
    return this.toBuffer().toString('binary');
  }
}
