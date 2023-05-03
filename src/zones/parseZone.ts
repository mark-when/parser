import { DateTime } from "luxon";
import { Caches } from "../Cache";
import { ParsingContext } from "../ParsingContext";

export function parseZone(
  parsedHeader: any,
  context: ParsingContext,
  cache?: Caches
) {
  if (typeof parsedHeader.timezone !== "undefined") {
    const tz = `${parsedHeader.timezone}`;
    const cached = cache?.zones.get(tz);
    if (cached) {
      context.timezone = cached;
    } else {
      const formats = ["z", "ZZZ", "ZZ", "Z"] as const;
      let zoneDateTime: DateTime;
      for (const format of formats) {
        zoneDateTime = DateTime.fromFormat(tz, format, { setZone: true });
        if (zoneDateTime.isValid && zoneDateTime.zone.isValid) {
          cache?.zones.set(tz, zoneDateTime.zone);
          context.timezone = zoneDateTime.zone;
          break;
        }
        if (format !== "z") {
          // try with a plus appended in case the yaml parser turned it into a number
          zoneDateTime = DateTime.fromFormat(`+${tz}`, format, {
            setZone: true,
          });
          if (zoneDateTime.isValid && zoneDateTime.zone.isValid) {
            cache?.zones.set(tz, zoneDateTime.zone);
            context.timezone = zoneDateTime.zone;
            break;
          }
        }
      }
    }
  }
}
