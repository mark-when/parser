import { ParsingContext } from "..";
import { GROUP_END_REGEX } from "../regex";
import { RangeType } from "../Types";

export function checkGroupEnd(
  line: string,
  i: number,
  lengthAtIndex: number[],
  context: ParsingContext
): boolean {
  if (context.currentPath.length > 1 && line.match(GROUP_END_REGEX)) {
    // We are ending our subgroup
    // context.events.push(context.eventSubgroup);
    // context.eventSubgroup = undefined;
    context.ranges.push({
      from: lengthAtIndex[i],
      to: lengthAtIndex[i] + line.length,
      type: RangeType.Section,
      lineFrom: {
        line: i,
        index: 0,
      },
      lineTo: {
        line: i,
        index: line.length,
      },
    });
    context.endCurrentGroup(lengthAtIndex[i] + line.length, {
      line: i,
      index: line.length,
    });
    return true;
  }
  return false;
}
