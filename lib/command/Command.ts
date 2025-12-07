import { JitCommand } from 'lib/types/JitCommand.js';
import Add from './Add.js';
import Base, { CommandContext } from './Base.js';
import Commit from './Commit.js';
import Init from './Init.js';

export default class Command {
  private readonly commands: Record<
    JitCommand,
    new (args: CommandContext) => Base
  > = {
    [JitCommand.Add]: Add,
    [JitCommand.Init]: Init,
    [JitCommand.Commit]: Commit,
  };

  dispatch(name: JitCommand, targetDir: string, root: string, args?: string[]) {
    if (!this.commands[name]) throw new Error(`${name} is not a jit command.`);

    const ctx: CommandContext = {
      root,
      ...(name === JitCommand.Init ? { targetDir } : { args }),
    };

    const commandClass = this.commands[name];
    const command = new commandClass(ctx);
    command.run();
  }
}
