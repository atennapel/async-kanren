import * as L from './list';

export type Stream<T> = Nil | Cons<T> | Delay<T>;

export type Nil = { tag: 'Nil' };
export const Nil: Nil = { tag: 'Nil' };
export type Cons<T> = { tag: 'Cons', head: T, tail: Stream<T> };
export const Cons = <T>(head: T, tail: Stream<T>): Cons<T> => ({ tag: 'Cons', head, tail });
export type Delay<T> = { tag: 'Delay', promise: () => Promise<Stream<T>> };
export const Delay = <T>(promise: () => Promise<Stream<T>>): Delay<T> => ({ tag: 'Delay', promise });

export const lazy = <T>(fn: () => Stream<T>): Delay<T> =>
  Delay(() => new Promise(resolve => resolve(fn())));

export const singleton = <T>(val: T): Cons<T> => Cons(val, Nil);

export const map = <A, B>(s: Stream<A>, fn: (val: A) => B): Stream<B> =>
  s.tag === 'Nil' ? s :
  s.tag === 'Cons' ? Cons(fn(s.head), map(s.tail, fn)) :
  Delay(() => s.promise().then(t => map(t, fn)));
export const append = <T>(a: Stream<T>, b: Stream<T>): Stream<T> =>
  a.tag === 'Nil' ? b :
  a.tag === 'Cons' ? Cons(a.head, append(b, a.tail)) :
  Delay(() => a.promise().then(t => append(b, t)));
export const flatMap = <A, B>(s: Stream<A>, fn: (val: A) => Stream<B>): Stream<B> =>
  s.tag === 'Nil' ? Nil :
  s.tag === 'Cons' ? append(fn(s.head), flatMap(s.tail, fn)) :
  Delay(() => s.promise().then(t => flatMap(t, fn)));

export const take = <T>(s: Stream<T>, n: number): Promise<L.List<T>> =>
  n <= 0 || s.tag === 'Nil' ? Promise.resolve(L.Nil) :
  s.tag === 'Cons' ? take(s.tail, n - 1).then(rest => L.Cons(s.head, rest)) :
  s.promise().then(t => take(t, n));
