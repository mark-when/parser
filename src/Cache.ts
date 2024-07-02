import * as LRUCache from "lru-cache";
import { DateRangeIso, GranularDateTime } from "./Types.js";
import { Zone } from "luxon";

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

export class Caches {
  zones: LRUCache<string, Zone>;

  caches: { [zoneName: string]: Cache } = {};

  constructor() {
    this.zones = newLru();
  }

  zone(timezone: Zone) {
    const name = timezone.name;
    const existing = this.caches[name];
    if (existing) {
      return existing;
    }
    this.caches[name] = new Cache();
    return this.caches[name];
  }
}
