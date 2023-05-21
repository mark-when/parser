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
    const from = lengthAtIndex[i];
    const indexInLine =
      line.indexOf(checklistItemMatch[1]) + checklistItemMatch[1].length;
    const to = from + indexInLine;
    const indicator: Range = {
      type: RangeType.CheckboxItemIndicator,
      from,
      to,

      content:
        checklistItemMatch.includes("x") || checklistItemMatch.includes("X"),
    };
    const contents: Range = {
      type: RangeType.ListItemContents,
      from: to,
      to: from + line.length - 1,
    };
    context.ranges.push(...[indicator, contents]);
    return [indicator, contents];
  } else if (line.match(LIST_ITEM_REGEX)) {
    const from = lengthAtIndex[i];
    const indicator = {
      type: RangeType.listItemIndicator,
      from: lengthAtIndex[i],
      to: from + 1,
    };
    const contents = {
      type: RangeType.ListItemContents,
      from: from,
      to: from + line.length - 1,
    };
    context.ranges.push(...[indicator, contents]);
    return [indicator, contents];
  }
  return false;
}
