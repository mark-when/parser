import LRUCache from "lru-cache";
import { DateRangeIso, GranularDateTime } from "./Types.js";

const newLru = <K, V>() => new LRUCache<K, V>({ max: 1000 });

export class Cache {
  slashDate: LRUCache<string, GranularDateTime>;
  roundDateUp: LRUCache<string, string>;
  ranges: LRUCache<string, DateRangeIso>;

  constructor() {
    this.slashDate = newLru();
    this.roundDateUp = newLru();
    this.ranges = newLru();
  }
}
