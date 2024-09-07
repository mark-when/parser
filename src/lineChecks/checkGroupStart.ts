import { ParsingContext } from "../ParsingContext.js";
import { parseGroupFromStartTag } from "../dateRange/utils.js";
import { GROUP_START_REGEX } from "../regex.js";
import { RangeType } from "../Types.js";
import { Caches } from "../Cache.js";
import { parseZone } from "../zones/parseZone.js";
import { parseProperties } from "../parseHeader.js";

export function checkGroupStart(
  lines: string[],
  i: number,
  lengthAtIndex: number[],
  context: ParsingContext,
  cache?: Caches
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
    const lastTagsDefinitionInHeader =
      group.tags?.length &&
      context.header[`)${group.tags[group.tags.length - 1]}`];
    if (
      typeof lastTagsDefinitionInHeader === "object" &&
      typeof lastTagsDefinitionInHeader.timezone !== "undefined"
    ) {
      const zone = parseZone(lastTagsDefinitionInHeader.timezone, cache);
      if (zone) {
        context.timezoneStack.push(zone);
      }
    }

    const { properties, i: end } = parseProperties(
      lines,
      lengthAtIndex,
      i + 1,
      context,
      cache
    );
    group.properties = properties;

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
