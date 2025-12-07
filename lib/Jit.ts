import Command from './command/Command.js';
import { JitCommand } from './types/JitCommand.js';

export default class Jit {
  constructor() {
    const name = process.argv[2];
    const dir = process.argv[3];
    const args = process.argv.slice(3);

    try {
      const command = this.parseCommand(name);
      new Command().dispatch(command, {
        targetDir: dir,
        root: process.cwd(),
        args,
      });
    } catch (error) {
      console.error(`jit: ${error.message}`);
    }
  }

  parseCommand(name: string): JitCommand {
    if (!Object.values(JitCommand).includes(name as JitCommand))
      throw new Error(`${name} is not a jit command.`);
    return name as JitCommand;
  }
}
