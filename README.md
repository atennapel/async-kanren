An implementation of microKanren in TypeScript.
Uses an asynchronous stream based on Promises.
The goal is to have a version of Kanren backed by a Entity-Attribute-Value store.

Try it out at https://atennapel.github.io/async-kanren

```typescript
import { Term, all, runAll } from './kanren';
import { take } from './stream';
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
  const results = await take(res, 100);
  console.log(toArray(results));

  await store.close();
})().catch(err => {
  console.log(err);
});
```
