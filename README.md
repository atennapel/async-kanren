An implementation of microKanren in TypeScript.
Uses an asynchronous stream based on Promises.
The goal is to have a version of Kanren backed by a SQLite database.

```typescript
import { disj, eq, run, Term } from './kanren';
import { take } from './stream';
import { toArray } from './list';

const goal = (x: Term) => disj(eq(x, 1), eq(x, 2));
const res = run(goal);

(async () => {
  const results = await take(res, 100);
  console.log(toArray(results)); // [ 1, 2 ]
})();
```
