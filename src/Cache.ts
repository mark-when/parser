import { LRUCache } from "lru-cache";
import { DateRangeIso, GranularDateTime } from "./Types.js";
import { Zone } from "luxon";

const newLru = <K, V extends {}>() => new LRUCache<string, V>({ max: 1000 });

export class Cache {
  slashDate: LRUCache<string, GranularDateTime> = newLru();
  roundDateUp: LRUCache<string, string> = newLru();
  ranges: LRUCache<string, DateRangeIso> = newLru();
}

export class Caches {
  zones: LRUCache<string, Zone> = newLru();
  yaml: LRUCache<string, any> = newLru();
  caches: { [zoneName: string]: Cache } = {};

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
