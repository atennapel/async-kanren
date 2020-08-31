import { Prim, Term, Goal, isVar, isPrim, any, all, eq, delayPromise, walk } from './kanren';

export type EAV = { entity: string, attribute: string, value: Prim };
export const EAV = (entity: string, attribute: string, value: Prim): EAV =>
  ({ entity, attribute, value });

export interface Store {
  query(e: string | null, a: string | null, v: Prim | null): Promise<EAV[]>;
}

export interface MutableStore extends Store {
  add(eavs: EAV[]): Promise<true>;
}

const terr = (msg: string) => { throw new TypeError(msg) };
export const fact = (store: Store, e_: Term, a_: Term, v_: Term): Goal => state => {
  const e = walk(state.env, e_);
  const a = walk(state.env, a_);
  const v = walk(state.env, v_);
  const qe = isVar(e) ? null : typeof e === 'string' ? e : terr(`entity in "fact" must be string: ${e}`);
  const qa = isVar(a) ? null : typeof a === 'string' ? a : terr(`attribute in "fact" must be string: ${a}`);
  const qv = isVar(v) ? null : isPrim(v) ? v : terr(`value in "fact" must be a primitive`);
  const res = store.query(qe, qa, qv);
  const prom = res.then(res => any(res.map(eav => all([eq(e, eav.entity), eq(a, eav.attribute), eq(v, eav.value)]))));
  return delayPromise(prom)(state);
};
