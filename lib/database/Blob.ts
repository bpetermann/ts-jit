import { JitObject } from 'lib/types/JitObject.js';

export default class Blob implements JitObject {
  private _oid: string | undefined;

  constructor(private readonly data: NonSharedBuffer) {}

  get oid(): string {
    return this._oid as string;
  }

  set oid(id: string) {
    this._oid = id;
  }

  type(): string {
    return 'blob';
  }

  toString(): string {
    return this.data.toString();
  }
}
