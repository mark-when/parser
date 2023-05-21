import { Caches } from "../Cache.js";
import { ParsingContext } from "../ParsingContext.js";
import { GROUP_END_REGEX } from "../regex.js";
import { RangeType } from "../Types.js";

export function checkGroupEnd(
  line: string,
  i: number,
  lengthAtIndex: number[],
  context: ParsingContext,
  cache?: Caches
): boolean {
  if (context.currentPath.length > 1 && line.match(GROUP_END_REGEX)) {
    // We are ending our subgroup
    // context.events.push(context.eventSubgroup);
    // context.eventSubgroup = undefined;
    context.ranges.push({
      from: lengthAtIndex[i],
      to: lengthAtIndex[i] + line.length,
      type: RangeType.Section,
    });
    context.endCurrentGroup(
      lengthAtIndex[i] + line.length,
      {
        line: i,
        index: line.length,
      },
      cache
    );
    return true;
  }
  return false;
}
