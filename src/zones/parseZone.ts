import { DateTime } from "luxon";
import { Caches } from "../Cache";
import { ParsingContext } from "../ParsingContext";

export function parseZone(zoneString: string, cache?: Caches) {
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

export function parseTopLevelHeaderZone(
  parsedHeader: any,
  context: ParsingContext,
  cache?: Caches
) {
  if (typeof parsedHeader.timezone !== "undefined") {
    const tz = parseZone(parsedHeader.timezone, cache);
    if (tz) {
      context.timezoneStack = [tz];
    }
  }
}
