import Debug from 'debug';
import fs from 'fs';
import path from 'path';

const debug = Debug('OBD2.Core.DTC');

export class DTC {
  private list: any = [];

  constructor() {
    this.loadDtcList();

    debug('Ready');
  }

  public loadDtcList(basePath?: string) {
    debug('Loading list');

    basePath = basePath ? basePath : path.join(__dirname, '..', 'data', 'dtc');

    try {
      if (fs.statSync(basePath)) {
        fs.readdirSync(basePath).forEach((file: string) => {
          this.list.push(require(path.join(basePath, file)));
        });
      }
    } catch (e) {
      debug('[ERROR] Data directory not found!');
    }

    debug('Loaded count: ' + this.list.length);
  }

  public getList() {
    return this.list;
  }

  public getByName(slug: string) {
    //
  }

  public getByPid(pid: string, mode?: string) {
    //
  }
}
