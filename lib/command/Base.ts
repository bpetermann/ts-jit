export interface CommandContext {
  rootPath: string;
  targetDir?: string;
  args?: string[];
  message?: string;
}

export default class Base {
  constructor(protected readonly context: CommandContext) {}

  run() {
    throw new Error('Method not implemented');
  }
}
