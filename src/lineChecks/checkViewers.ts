import { ParsingContext } from "..";
import { VIEWERS_REGEX } from "../regex";
import { RangeType, Range } from "../Types";

export function checkViewers(
  line: string,
  i: number,
  lengthAtIndex: number[],
  context: ParsingContext
): boolean {
  const viewersMatch = line.match(VIEWERS_REGEX);
  if (viewersMatch) {
    const viewTagIndex = line.indexOf(viewersMatch[1]);
    context.viewers = viewersMatch[2]
      .trim()
      .split(/ |,/)
      .filter((email) => !!email && email.includes("@"));
    context.ranges.push({
      type: RangeType.View,
      from: lengthAtIndex[i] + viewTagIndex,
      to: lengthAtIndex[i] + viewTagIndex + viewersMatch[1].length,
      lineFrom: {
        line: i,
        index: viewTagIndex,
      },
      lineTo: {
        line: i,
        index: viewTagIndex + viewersMatch[1].length,
      },
    });
    const viewerRanges = [] as Range[];
    for (let j = 0; j < context.viewers.length; j++) {
      const index = line.indexOf(
        context.viewers[j],
        viewerRanges.length
          ? viewerRanges[viewerRanges.length - 1].from - lengthAtIndex[i]
          : 0
      );
      viewerRanges.push({
        type: RangeType.Viewer,
        from: lengthAtIndex[i] + index,
        to: lengthAtIndex[i] + index + context.viewers[j].length,
        lineFrom: {
          line: i,
          index,
        },
        lineTo: {
          line: i,
          index: index + context.viewers[j].length,
        },
      });
    }
    context.ranges.push(...viewerRanges);
    return true;
  }
  return false;
}
