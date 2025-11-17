import Entry from 'lib/index/Entry.js';
import { JitObject } from '../utils/JitObject.js';
type TreeEntry = Entry | Tree;

export default class Tree implements JitObject {
  private _oid: string | undefined;
  public entries: Record<string, TreeEntry> = {};
  static TREE_MODE = 0o40000;

  constructor() {}

  static build(entries: Entry[]) {
    const sortedEntries = entries.sort((a, b) => a.path.localeCompare(b.path));

    const tree = new Tree();

    sortedEntries.forEach((entry) =>
      tree.addEntry(entry.parentDirectories(), entry)
    );

    return tree;
  }

  get oid(): string | undefined {
    return this._oid;
  }

  set oid(id: string) {
    this._oid = id;
  }

  type(): string {
    return 'tree';
  }

  get mode(): number {
    return Tree.TREE_MODE;
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
        const modeStr = (
          entry instanceof Tree ? entry.mode : entry.mode
        ).toString(8);
        const modeAndName = Buffer.from(`${modeStr} ${name}\0`, 'utf8');
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
