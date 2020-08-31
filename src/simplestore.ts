import { EAV, MutableStore } from './store';
import { Prim } from './kanren';

export class SimpleStore implements MutableStore {
  store: EAV[];

  constructor(initial: EAV[] = []) {
    this.store = initial;
  }

  async add(eavs: EAV[]): Promise<true> {
    for (let i = 0, l = eavs.length; i < l; i++) this.store.push(eavs[i]);
    return true;
  }

  async query(e: string | null, a: string | null, v: Prim | null): Promise<EAV[]> {
    const r: EAV[] = [];
    for (let i = 0, l = this.store.length; i < l; i++) {
      const c = this.store[i];
      if ((e === null || c.entity === e) && (a === null || c.attribute === a) && (v === null || c.value === v))
        r.push(c);
    }
    return r;
  }

}
