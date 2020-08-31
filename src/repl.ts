import { v4 as uuid } from 'uuid';
import { EAV, fact, MutableStore } from './store';
import { runAllN, Term } from './kanren';
import { takeAll } from './stream';
import { toArray } from './list';
import { SimpleStore } from './simplestore';

const helpMessage = `
COMMANDS
:help : this message
:db databaseName : change sqlite database to "databaseName"
+ entity/attribute/value : add a fact
+ _/attribute/value : add a fact but generate a uuid for the entity
? entity/attribute/value : query
`.trim();

let store: MutableStore = new SimpleStore();

export const initREPL = async (cb: (error?: Error) => void) => {
  try {
    await store.initialize();
    cb();
  } catch (err) {
    cb(err);
  }
};

export const runREPL = async (_s: string, cb: (msg: string, err?: boolean) => void) => {
  try {
    _s = _s.trim();
    if (_s === ':help') return cb(helpMessage);
    if (_s.startsWith(':db')) {
      const sqlitestore = require('./sqlitestore');
      const db = _s.slice(3).trim();
      store = new sqlitestore.SqliteStore(db);
      await store.initialize();
      return cb(`changed database to ${db}`);
    }
    if (_s[0] === '+') {
      const rest = _s.slice(1);
      const split = rest.split('/');
      const entity = split[0].trim();
      const attribute = split[1].trim();
      const value = split.slice(2).join('/').trim();
      const realvalue = value[0] === '"' || /[0-9]/.test(value[0]) ? JSON.parse(value) : value;
      const realentity = entity === '_' ? uuid() : entity;
      await store.add([EAV(realentity, attribute, realvalue)]);
      return cb(`${realentity}/${attribute}/${JSON.stringify(realvalue)}`);
    }
    if (_s[0] === '?') {
      const rest = _s.slice(1);
      const split = rest.split('/');
      const entity = split[0].trim();
      const attribute = split[1].trim();
      const value = split.slice(2).join('/').trim();
      const realvalue = value[0] === '"' || /[0-9]/.test(value[0]) ? JSON.parse(value) : value;
      const n = (entity === '_' ? 1 : 0) + (attribute === '_' ? 1 : 0) + (realvalue === '_' ? 1 : 0);
      const res = runAllN(n, a => {
        const args: Term[] = [];
        let i = 0;
        args.push(entity === '_' ? a[i++] : entity);
        args.push(attribute === '_' ? a[i++] : attribute);
        args.push(realvalue === '_' ? a[i++] : realvalue);
        return fact(store, args[0], args[1], args[2]);
      });
      const a = await takeAll(res);
      return cb(toArray(a).map(x => JSON.stringify(x)).join('\n'));
    }
  } catch (err) {
    console.log('' + err);
    return cb(err, true);
  }
};
