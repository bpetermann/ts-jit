import Command from './command/Command.js';
import { JitCommand } from './types/JitCommand.js';

export default class Jit {
  constructor() {
    const name = process.argv[2] as JitCommand;
    const dir = process.argv[3];
    const args = process.argv.slice(3);

    try {
      new Command().dispatch(name, dir, process.cwd(), args);
    } catch (error) {
      console.error(`jit: ${error.message}`);
    }
  }
}
