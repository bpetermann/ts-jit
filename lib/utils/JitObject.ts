export interface JitObject {
  oid: string | undefined;
  type(): string;
  toString(): string;
}
