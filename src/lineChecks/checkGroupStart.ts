import { ParsingContext } from "../ParsingContext.js";
import { parseGroupFromStartTag } from "../dateRange/utils.js";
import { GROUP_START_REGEX } from "../regex.js";
import { RangeType } from "../Types.js";
import { parseZone } from "../zones/parseZone.js";
import { parseProperties } from "../parseHeader.js";

export function checkGroupStart(
  lines: string[],
  i: number,
  lengthAtIndex: number[],
  context: ParsingContext
): { end: number } | false {
  const line = lines[i];
  const groupStart = line.match(GROUP_START_REGEX);
  if (groupStart) {
    // We're starting a new group here.
    // Use the path to determine where it goes.
    const range = {
      from: lengthAtIndex[i],
      to: lengthAtIndex[i] + groupStart[0].length,
      type: RangeType.Section,
    };
    context.ranges.push(range);

    // This should create a new Array<Node> that we can push
    const group = parseGroupFromStartTag(line, groupStart, range);
    const { properties, i: end } = parseProperties(
      lines,
      lengthAtIndex,
      i + 1,
      context
    );

    group.properties = properties;
    const timezoneProperty = properties.find(([k, v]) => {
      return (
        (k === "tz" || k === "timezone") &&
        (typeof v === "string" || typeof v === "number")
      );
    });
    if (timezoneProperty) {
      const zone = parseZone(timezoneProperty[1], context.cache);
      // We're not saving it on the group but instead looking it up when needed. Parsing
      // it now will save it in the cache
      // We can, though, indicate whether the zone is erroneous with a parse message.
      if (!zone) {
        context.parseMessages.push({
          type: "error",
          message: "Unable to parse timezone",
          pos: [range.from, range.to],
        });
      }
    }

    context.push(group);
    context.startFoldableSection({
      type: RangeType.Section,
      startLine: i,
      startIndex: lengthAtIndex[i],
      endIndex: lengthAtIndex[i] + line.length,
      foldStartIndex: lengthAtIndex[i] + line.length,
    });

    return { end };
  }
  return false;
}
