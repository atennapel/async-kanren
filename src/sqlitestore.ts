import { MutableStore, EAV } from './store';
import { verbose, Database } from 'sqlite3';
import { Prim } from './kanren';

export class SqliteStore implements MutableStore {

  private db: Database

  constructor(url: string = ':memory:') {
    this.db = new (verbose().Database)(url);
  }

  initialize(): Promise<true> {
    return new Promise((resolve, reject) => {
      this.db.run('create table if not exists facts (id integer primary key autoincrement, entity TEXT, attribute TEXT, value TEXT)', (_: any, err: Error | null) => {
        if (err) reject(err);
        resolve(true);
      });
    });
  }

  close(): Promise<true> {
    return new Promise((resolve, reject) =>
      this.db.close(err => err ? reject(err) : resolve(true)));
  }

  add(eavs: EAV[]): Promise<true> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('begin transaction');
        this.db.parallelize(() => {
          for (let i = 0, l = eavs.length; i < l; i++) {
            const c = eavs[i];
            this.db.run(`insert into facts (entity, attribute, value) values (?, ?, ?)`, c.entity, c.attribute, JSON.stringify(c.value));
          }
        });
        this.db.run('commit', (_: any, err: Error | null) => {
          if (err) reject(err);
          resolve(true);
        });
      });
    });
  }

  async query(e: string | null, a: string | null, v: Prim | null): Promise<EAV[]> {
    const cb = (resolve: (res: EAV[]) => void, reject: (err: Error) => void) => (err: Error | null, rows: any[]) => {
      if (err) reject(err);
      resolve(rows.map(eav => EAV(eav.entity, eav.attribute, JSON.parse(eav.value))));
    };

    if (e === null && a === null && v === null)
      return new Promise((resolve, reject) => this.db.all(`select entity, attribute, value from facts`, cb(resolve, reject)));

    if (a === null && v === null)
      return new Promise((resolve, reject) =>
        this.db.all(`select entity, attribute, value from facts where entity=?`, e, cb(resolve, reject)));
    if (e === null && v === null)
      return new Promise((resolve, reject) =>
        this.db.all(`select entity, attribute, value from facts where attribute=?`, a, cb(resolve, reject)));
    if (e === null && a === null)
      return new Promise((resolve, reject) =>
        this.db.all(`select entity, attribute, value from facts where value=?`, JSON.stringify(v), cb(resolve, reject)));

    if (e === null)
      return new Promise((resolve, reject) =>
        this.db.all(`select entity, attribute, value from facts where attribute=? and value=?`, a, JSON.stringify(v), cb(resolve, reject)));
    if (a === null)
      return new Promise((resolve, reject) =>
        this.db.all(`select entity, attribute, value from facts where entity=? and value=?`, e, JSON.stringify(v), cb(resolve, reject)));
    if (v === null)
      return new Promise((resolve, reject) =>
        this.db.all(`select entity, attribute, value from facts where entity=? and attribute=?`, e, a, cb(resolve, reject)));

    return new Promise((resolve, reject) =>
      this.db.all(`select entity, attribute, value from facts where entity=? and attribute=? and value=?`, e, a, JSON.stringify(v), cb(resolve, reject)));
  }

}
