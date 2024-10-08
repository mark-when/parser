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
  caches: [Zone, Cache][] = [];

  zone(timezone: Zone): Cache {
    for (let i = 0; i < this.caches.length; i++) {
      if (this.caches[i][0].equals(timezone)) {
        return this.caches[i][1];
      }
    }
    const cache = new Cache();
    this.caches.push([timezone, cache]);
    return cache;
  }
}
