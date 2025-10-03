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
}
