import Add from './Add.js';
import Base, { CommandContext } from './Base.js';
import Commit from './Commit.js';
import Init from './Init.js';

export default class Command {
  private readonly commands: Record<
    string,
    new (args: CommandContext) => Base
  > = {
    add: Add,
    init: Init,
    commit: Commit,
  };

  dispatch(name: string, targetDir: string, args?: string[]) {
    if (!this.commands[name]) throw new Error(`${name} is not a jit command.`);

    const ctx: CommandContext = {
      root: process.cwd(),
      ...(name === 'init' ? { targetDir } : { args }),
    };

    const commandClass = this.commands[name];
    const command = new commandClass(ctx);
    command.run();
  }
}
