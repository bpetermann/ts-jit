import Command from './command/Command.js';

export default class Jit {
  constructor() {
    const name = process.argv[2];
    const dir = process.argv[3];
    const args = process.argv.slice(3);

    try {
      new Command().dispatch(name, dir, args);
    } catch (error) {
      console.error(`jit: ${error.message}`);
    }
  }
}
