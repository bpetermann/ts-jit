export class ExitError extends Error {
  constructor(message: string, public exitCode: number) {
    super(message);
  }
}

export class MissingFile extends Error {}

export class NoPermission extends Error {}

export class EndOfFile extends Error {}

export class InvalidChecksum extends Error {}
