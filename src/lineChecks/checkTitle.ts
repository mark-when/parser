import { ParsingContext } from "../ParsingContext";
import { TITLE_REGEX } from "../regex";
import { RangeType } from "../Types";

export function checkTitle(
  line: string,
  i: number,
  lengthAtIndex: number[],
  context: ParsingContext
): boolean {
  const titleMatch = line.match(TITLE_REGEX);
  if (titleMatch) {
    context.title = titleMatch[2].trim();
    const titleTagIndex = line.indexOf(titleMatch[1]);
    context.ranges.push({
      type: RangeType.Title,
      from: lengthAtIndex[i] + titleTagIndex,
      to: lengthAtIndex[i] + titleTagIndex + titleMatch[1].length,
      lineFrom: {
        line: i,
        index: titleTagIndex,
      },
      lineTo: {
        line: i,
        index: titleTagIndex + titleMatch[1].length,
      },
    });
    return true;
  }
  return false;
}
