import path from 'path';

export default class Entry {
  private readonly REGULAR_MODE = '100644';
  private readonly EXECUTABLE_MODE = '100755';

  constructor(
    public name: string,
    public oid: string,
    private executable: boolean
  ) {}

  get mode(): string {
    return this.executable ? this.EXECUTABLE_MODE : this.REGULAR_MODE;
  }

  get basename(): string {
    return path.basename(this.name);
  }

  descendUntilLast(): string[] {
    const parts = this.name.split(path.sep);
    const result: string[] = [];

    for (let i = 0; i < parts.length - 1; i++) {
      result.push(parts.slice(0, i + 1).join(path.sep));
    }

    return result;
  }
}
