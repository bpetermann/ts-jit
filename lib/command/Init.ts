import { mkdirSync } from 'fs';
import { join, resolve } from 'path';
import Base from './Base.js';

export default class Init extends Base {
  override run() {
    const rootPath = resolve(this.context.targetDir ?? process.cwd());
    const gitPath = join(rootPath, '.git');

    try {
      ['objects', 'refs'].forEach((dir) =>
        mkdirSync(join(gitPath, dir), {
          recursive: true,
        })
      );

      console.log(`Initialized empty Jit repository in ${gitPath}`);
      return;
    } catch (e) {
      throw new Error(`failed to create folder ${e}`);
    }
  }
}
