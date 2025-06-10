import { DateTime } from "luxon";
import { Caches } from "../Cache";

export function parseZone(zoneString: string | number, cache?: Caches) {
  const tz = `${zoneString}`;
  const cached = cache?.zones.get(tz);
  if (cached) {
    return cached;
  } else {
    const formats = ["z", "ZZZ", "ZZ", "Z"] as const;
    let zoneDateTime: DateTime;
    for (const format of formats) {
      zoneDateTime = DateTime.fromFormat(tz, format, { setZone: true });
      if (zoneDateTime.isValid && zoneDateTime.zone.isValid) {
        cache?.zones.set(tz, zoneDateTime.zone);
        return zoneDateTime.zone;
      }
      if (format !== "z") {
        // try with a plus appended in case the yaml parser turned it into a number
        zoneDateTime = DateTime.fromFormat(`+${tz}`, format, {
          setZone: true,
        });
        if (zoneDateTime.isValid && zoneDateTime.zone.isValid) {
          cache?.zones.set(tz, zoneDateTime.zone);
          return zoneDateTime.zone;
        }
      }
    }
  }
}
