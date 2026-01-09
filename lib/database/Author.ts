export default class Author {
  constructor(
    private name?: string,
    private email?: string,
    private timestamp?: number,
    private timezone: string = Author.formatTimezone(new Date()),
  ) {}

  static formatTimezone(date: Date): string {
    const offset = -date.getTimezoneOffset();
    const sign = offset >= 0 ? '+' : '-';
    const abs = Math.abs(offset);
    const hours = String(Math.floor(abs / 60)).padStart(2, '0');
    const mins = String(abs % 60).padStart(2, '0');
    return `${sign}${hours}${mins}`;
  }

  toString(): string {
    return `${this.name} <${this.email}> ${this.timestamp} ${this.timezone}`;
  }

  static parse(line: string): Author {
    const match = line.match(/^(.*) <(.*)> (\d+) ([+-]\d{4})$/);
    if (!match) return new Author(line);

    const [, name, email, ts, tz] = match;
    return new Author(name, email, parseInt(ts, 10), tz);
  }
}
