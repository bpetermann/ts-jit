import Base from './Base.js';

export default class Status extends Base {
  untracked: string[] = [];

  override run() {
    this.repo.index.load();

    this.scanWorkspace();

    this.untracked.forEach((file) => console.log(`?? ${file}`));
  }

  private scanWorkspace(prefix: string = ''): void {
    const entries = this.repo.workspace.listDir(prefix);

    for (const [path, stat] of Object.entries(entries)) {
      const isTracked = this.repo.index.tracked(path);

      if (isTracked) {
        if (stat.isDirectory()) {
          this.scanWorkspace(path);
        }
      } else {
        const displayPath = stat.isDirectory() ? `${path}/` : path;

        this.untracked.push(displayPath);
      }
    }
  }
}
