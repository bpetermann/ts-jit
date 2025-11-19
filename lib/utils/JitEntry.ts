export default interface JitEntry {
  basename: string;
  mode: string | number;
  oid: string;
  path: string;
  parentDirectories(): string[];
}
