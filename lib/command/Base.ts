import Repository from '../Repository.js';

export interface CommandContext {
  root: string;
  targetDir?: string;
  args?: string[];
  message?: string;
}

export default class Base {
  repo: Repository;

  constructor(protected readonly context: CommandContext) {
    this.repo = new Repository(this.context.root);
  }

  run() {
    throw new Error('Method not implemented');
  }
}
