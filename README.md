An implementation of microKanren in TypeScript.
Uses an asynchronous stream based on Promises.
The goal is to have a version of Kanren backed by a Entity-Attribute-Value store.

```typescript
import { run, Term, Goal, conj, anyOf } from './kanren';
import { take } from './stream';
import { toArray } from './list';

const fruit = anyOf(['apple', 'pear', 'banana', 'melon']);
const tasty = anyOf(['apple', 'pear'])

const goal = (x: Term): Goal => conj(fruit(x), tasty(x));
const res = run(goal);

(async () => {
  const results = await take(res, 100);
  console.log(toArray(results));
})();
```
