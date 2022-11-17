import { ParsingContext } from "..";
import { parseGroupFromStartTag } from "../dateRange/utils";
import { GROUP_START_REGEX } from "../regex";
import { RangeType } from "../Types";

export function checkGroupStart(
  line: string,
  i: number,
  lengthAtIndex: number[],
  context: ParsingContext
): boolean {
  const groupStart = line.match(GROUP_START_REGEX);
  if (groupStart) {
    // We're starting a new group here.
    // Use the path to determine where it goes.
    // path = [0, 3, 0, 1]

    // if (context.eventSubgroup) {
    //   context.events.push(context.eventSubgroup);
    // }

    // context.finishFoldableSection(i, lengthAtIndex[i] - 1);
    const range = {
      from: lengthAtIndex[i],
      to: lengthAtIndex[i] + groupStart[0].length,
      type: RangeType.Section,
      lineFrom: {
        line: i,
        index: 0,
      },
      lineTo: {
        line: i,
        index: groupStart[0].length,
      },
    };
    context.ranges.push(range);

    // This should create a new Array<Node> that we can push
    const newGroup = parseGroupFromStartTag(line, groupStart, range);
    context.push(newGroup)
    // Make new foldable
    // context.foldables["section"] = {
    //   type: RangeType.Section,
    //   startLine: i,
    //   startIndex: lengthAtIndex[i],
    //   endIndex: lengthAtIndex[i] + line.length,
    //   foldStartIndex: lengthAtIndex[i] + line.length,
    // };

    return true;
  }
  return false;
}
