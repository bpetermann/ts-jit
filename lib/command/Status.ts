import Base from './Base.js';

export default class Status extends Base {
  override run() {
    this.repo.workspace
      .listFiles()
      .sort((a, b) => a.localeCompare(b))
      .forEach((file) => console.log(`?? ${file}`));
  }
}
