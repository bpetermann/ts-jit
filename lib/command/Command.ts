import { JitCommand } from '../types/JitCommand.js';
import Add from './Add.js';
import Base, { CommandContext } from './Base.js';
import Commit from './Commit.js';
import Init from './Init.js';

type JitClass = new (args: CommandContext) => Base;

export default class Command {
  private readonly commands: Record<JitCommand, JitClass> = {
    [JitCommand.Add]: Add,
    [JitCommand.Init]: Init,
    [JitCommand.Commit]: Commit,
  };

  dispatch(name: JitCommand, ctx: CommandContext) {
    const commandClass = this.commands[name];
    const command = new commandClass(ctx);
    command.run();
  }
}
