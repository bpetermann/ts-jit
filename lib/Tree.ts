import Entry from './Entry';
import { JitObject } from './JitObject';

export default class Tree implements JitObject {
  private MODE = '100644';
  private _oid: string | undefined;

  constructor(private entries: Array<Entry>) {}

  get oid(): string | undefined {
    return this._oid;
  }

  set oid(id: string) {
    this._oid = id;
  }

  type(): string {
    return 'tree';
  }

  toBuffer(): Buffer {
    const buffers: Buffer[] = this.entries
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(({ name, oid, mode }) => {
        const modeAndName = Buffer.from(`${mode} ${name}\0`, 'utf8');
        const oidBuffer = Buffer.from(oid!, 'hex');
        return Buffer.concat([modeAndName, oidBuffer]);
      });
    return Buffer.concat(buffers);
  }

  toString(): string {
    return this.toBuffer().toString('binary');
  }
}
