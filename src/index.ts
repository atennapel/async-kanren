import { disj, eq, run, Term } from './kanren';
import { take } from './stream';
import { toArray } from './list';

const goal = (x: Term) => disj(eq(x, 1), eq(x, 2));
const res = run(goal);

(async () => {
  const results = await take(res, 100);
  console.log(toArray(results));
})();
