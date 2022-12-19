import LRUCache from "lru-cache";
import { GranularDateTime } from "./Types";

const newLru = <K, V>() => new LRUCache<K, V>({ max: 1000 });

export class Cache {
  slashDate: LRUCache<string, GranularDateTime>;
  roundDateUp: LRUCache<string, string>;

  constructor() {
    this.slashDate = newLru();
    this.roundDateUp = newLru();
  }
}
