import { ParsingContext } from "../ParsingContext.js";
import { DESCRIPTION_REGEX } from "../regex.js";
import { RangeType } from "../Types.js";

export function checkDescription(
  line: string,
  i: number,
  lengthAtIndex: number[],
  context: ParsingContext
): boolean {
  const descriptionMatch = line.match(DESCRIPTION_REGEX);
  if (descriptionMatch) {
    context.description = descriptionMatch[2];
    const descriptionTagIndex = line.indexOf(descriptionMatch[1]);
    context.ranges.push({
      type: RangeType.Description,
      from: lengthAtIndex[i] + descriptionTagIndex,
      to: lengthAtIndex[i] + descriptionTagIndex + descriptionMatch[1].length,
      lineFrom: {
        line: i,
        index: descriptionTagIndex,
      },
      lineTo: {
        line: i,
        index: descriptionTagIndex + descriptionMatch[1].length,
      },
    });
    return true;
  }
  return false;
}
