import * as L from './list';
import * as S from './stream';

export type Id = number;

// using a class here just so that I can use instanceof
export class Var { id: Id; constructor(id: Id) { this.id = id } }
export const MkVar = (id: Id): Var => new Var(id);

export type Term = number | string | Var;

export type Env = L.Assoc<Id, Term>;

export type State = { id: Id, env: Env };
export const State = (id: Id, env: Env): State => ({ id, env });

export type Goal = (state: State) => S.Stream<State>;

export const initial: State = { id: 0, env: L.Nil };

export const walk = (s: Env, t: Term): Term => {
  if (t instanceof Var) {
    const v = L.find(s, t.id);
    return v === null ? t : v;
  }
  return t;
};

const occurs = (id: Id, t: Term): boolean => {
  if (t instanceof Var) return t.id === id;
  return false;
};

const bindVar = (s: Env, id: Id, t: Term): Env | null => {
  if(t instanceof Var && id === t.id) return s;
  if(occurs(id, t)) return null;
  return L.assoc(s, id, t);
};

export const unify = (s: Env, a_: Term, b_: Term): Env | null => {
  const a = walk(s, a_);
  const b = walk(s, b_);
  if (a === b) return s;
  if (a instanceof Var) return bindVar(s, a.id, b);
  if (b instanceof Var) return bindVar(s, b.id, a);
  return null;
};

export const eq = (a: Term, b: Term): Goal => ({ id, env }) => {
  const nenv = unify(env, a, b);
  return nenv ? S.singleton(State(id, nenv)) : S.Nil;
};

export const fail: Goal = _ => S.Nil;
export const succeed: Goal = state => S.singleton(state);

export const disj = (a: Goal, b: Goal): Goal => state => S.append(a(state), S.lazy(() => b(state)));
export const conj = (a: Goal, b: Goal): Goal => state => S.flatMap(a(state), b);
export const fresh = (fn: (vr: Var) => Goal): Goal => ({ id, env }) => fn(MkVar(id))(State(id + 1, env));

export const run = (fn: (vr: Var) => Goal): S.Stream<Term> =>
  S.map(fresh(fn)(initial), ({ env }) => walk(env, MkVar(initial.id)));
