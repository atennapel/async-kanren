export type List<T> = Nil | Cons<T>;

export type Nil = { tag: 'Nil' };
export const Nil: Nil = { tag: 'Nil' };
export type Cons<T> = { tag: 'Cons', head: T, tail: List<T> };
export const Cons = <T>(head: T, tail: List<T>): Cons<T> => ({ tag: 'Cons', head, tail });

export const singleton = <T>(val: T): Cons<T> => Cons(val, Nil);

export const map = <A, B>(l: List<A>, fn: (val: A) => B): List<B> =>
  l.tag === 'Nil' ? l : Cons(fn(l.head), map(l.tail, fn));

export const toArray = <T>(l: List<T>): T[] => {
  const r: T[] = [];
  let c = l;
  while (c.tag === 'Cons') {
    r.push(c.head);
    c = c.tail;
  }
  return r;
};

export type Assoc<K, V> = List<[K, V]>;
export const assoc = <K, V>(l: Assoc<K, V>, key: K, val: V): Assoc<K, V> =>
  Cons([key, val], l);
export const find = <K, V>(l: Assoc<K, V>, key: K): V | null => {
  let c = l;
  while (c.tag === 'Cons') {
    if (c.head[0] === key) return c.head[1];
    c = c.tail;
  }
  return null;
};
