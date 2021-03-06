import { Term, all, runAll } from './kanren';
import { takeAll } from './stream';
import { toArray } from './list';
import * as Store from './store';
import { EAV } from './store';
import { SqliteStore } from './sqlitestore';
import { v4 as uuid } from 'uuid';

(async () => {
  const store = new SqliteStore();
  await store.initialize();

  const fact = (e: Term, a: Term, v: Term) => Store.fact(store, e, a, v);

  const alpha = uuid();
  const beta = uuid();

  await store.add([
    EAV(alpha, 'type', 'person'),
    EAV(alpha, 'birthyear', 1992),
    EAV(alpha, 'name', 'Alpha'),
    EAV(alpha, 'phone', '0699999999'),

    EAV(beta, 'type', 'person'),
    EAV(beta, 'birthyear', 1991),
    EAV(beta, 'name', 'Beta'),
    EAV(beta, 'phone', '0699999999'),
  ]);

  const res = runAll((entity, name, phone) => all([
    fact(entity, 'type', 'person'),
    fact(entity, 'name', name),
    fact(entity, 'phone', phone),
  ]));
  const results = await takeAll(res);
  console.log(toArray(results));

  await store.close();
})().catch(err => {
  console.log(err);
});
