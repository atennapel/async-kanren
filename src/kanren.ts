import * as L from './list';
import * as S from './stream';
import { isArray } from 'util';

export type Id = number;

// using a class here just so that I can use instanceof
export class Var { id: Id; constructor(id: Id) { this.id = id } }
export const isVar = (t: Term): t is Var => t instanceof Var;
export const MkVar = (id: Id): Var => new Var(id);

export type Prim = number | string;
export const isPrim = (t: Term): t is Prim =>
  typeof t === 'string' || typeof t === 'number';
export type Term = Prim | Var | Term[];

export type Env = L.Assoc<Id, Term>;

export type State = { id: Id, env: Env };
export const State = (id: Id, env: Env): State => ({ id, env });

export type Goal = (state: State) => S.Stream<State>;

export const initial: State = { id: 0, env: L.Nil };

export const walk = (s: Env, t: Term): Term => {
  if (isVar(t)) {
    const v = L.find(s, t.id);
    return v === null ? t : v;
  }
  if (isArray(t)) return t.map(x => walk(s, x));
  return t;
};

const occurs = (id: Id, t: Term): boolean => {
  if (isVar(t)) return t.id === id;
  if (isArray(t)) return t.some(x => occurs(id, x));
  return false;
};

const bindVar = (s: Env, id: Id, t: Term): Env | null => {
  if(isVar(t) && id === t.id) return s;
  if(occurs(id, t)) return null;
  return L.assoc(s, id, t);
};

export const unify = (s: Env, a_: Term, b_: Term): Env | null => {
  const a = walk(s, a_);
  const b = walk(s, b_);
  if (a === b) return s;
  if (isVar(a)) return bindVar(s, a.id, b);
  if (isVar(b)) return bindVar(s, b.id, a);
  if (isArray(a) && isArray(b)) {
    const l = a.length;
    if (b.length !== l) return null;
    let c: Env | null = s;
    for (let i = 0; i < l; i++) {
      c = unify(c, a[i], b[i]);
      if (c === null) return null;
    }
    return c;
  }
  return null;
};

export const eq = (a: Term, b: Term): Goal => ({ id, env }) => {
  const nenv = unify(env, a, b);
  return nenv ? S.singleton(State(id, nenv)) : S.Nil;
};

export const fail: Goal = _ => S.Nil;
export const succeed: Goal = state => S.singleton(state);
export const delay = (g: () => Goal): Goal => state => S.lazy(() => g()(state));

export const disj = (a: Goal, b: Goal): Goal => state => S.append(a(state), S.lazy(() => b(state)));
export const conj = (a: Goal, b: Goal): Goal => state => S.flatMap(a(state), b);
export const fresh = (fn: (vr: Var) => Goal): Goal => ({ id, env }) => fn(MkVar(id))(State(id + 1, env));

export const any = (gs: Goal[], i: number = 0): Goal =>
  i < 0 || i >= gs.length ? fail : disj(gs[i], delay(() => any(gs, i + 1)));
export const all = (gs: Goal[], i: number = 0): Goal =>
  i < 0 || i >= gs.length ? succeed : conj(gs[i], delay(() => all(gs, i + 1)));

export const anyOf = (a: Prim[]) => (x: Term) => any(a.map(y => eq(x, y)));
export const allOf = (a: Prim[]) => (x: Term) => all(a.map(y => eq(x, y)));

export const run = (fn: (vr: Var) => Goal): S.Stream<Term> =>
  S.map(fresh(fn)(initial), ({ env }) => walk(env, MkVar(initial.id)));
