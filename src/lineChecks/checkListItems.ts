import { ParsingContext } from "../ParsingContext.js";
import { CHECKLIST_ITEM_REGEX, LIST_ITEM_REGEX } from "../regex.js";
import { RangeType, Range } from "../Types.js";
export function checkListItems(
  line: string,
  i: number,
  lengthAtIndex: number[],
  context: ParsingContext
): false | Range[] {
  const checklistItemMatch = line.match(CHECKLIST_ITEM_REGEX);
  if (checklistItemMatch) {
    const dashIndex = line.indexOf("-");
    const dashPosition = lengthAtIndex[i] + dashIndex;
    const checkboxStart =
      lengthAtIndex[i] + line.indexOf(checklistItemMatch[1]);
    const checkboxEnd = checkboxStart + checklistItemMatch[1].length;

    const dashIndicator: Range = {
      type: RangeType.listItemIndicator,
      from: dashPosition,
      to: dashPosition + 1,
    };

    const checkboxIndicator: Range = {
      type: RangeType.CheckboxItemIndicator,
      from: checkboxStart,
      to: checkboxEnd,
      content: checklistItemMatch[2] === "x" || checklistItemMatch[2] === "X",
    };

    const contents: Range = {
      type: RangeType.ListItemContents,
      from: checkboxEnd,
      to: lengthAtIndex[i] + line.length,
    };

    context.ranges.push(...[dashIndicator, checkboxIndicator, contents]);
    return [dashIndicator, checkboxIndicator, contents];
  } else if (line.match(LIST_ITEM_REGEX)) {
    const dashIndex = line.indexOf("-");
    const dashPosition = lengthAtIndex[i] + dashIndex;

    const indicator = {
      type: RangeType.listItemIndicator,
      from: dashPosition,
      to: dashPosition + 1,
    };

    const contents = {
      type: RangeType.ListItemContents,
      from: dashPosition + 2, // After "- "
      to: lengthAtIndex[i] + line.length,
    };

    context.ranges.push(...[indicator, contents]);
    return [indicator, contents];
  }
  return false;
}
