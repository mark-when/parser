import { ParsingContext } from "../ParsingContext";
import { CHECKLIST_ITEM_REGEX, LIST_ITEM_REGEX } from "../regex";
import { RangeType, Range } from "../Types";

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
      lineFrom: {
        line: i,
        index: 0,
      },
      lineTo: {
        line: i,
        index: indexInLine,
      },
      content:
        checklistItemMatch.includes("x") || checklistItemMatch.includes("X"),
    };
    const contents: Range = {
      type: RangeType.ListItemContents,
      from: to + 1,
      to: from - to - 1, // ? i dont get this
      lineFrom: {
        line: i,
        index: indexInLine + 1,
      },
      lineTo: {
        line: i,
        index: line.length,
      },
    };
    context.ranges.push(...[indicator, contents]);
    return [indicator, contents];
  } else if (line.match(LIST_ITEM_REGEX)) {
    const from = lengthAtIndex[i];
    const indicator = {
      type: RangeType.listItemIndicator,
      from: lengthAtIndex[i],
      to: from + 1,
      lineFrom: {
        line: i,
        index: 0,
      },
      lineTo: {
        line: i,
        index: 1,
      },
    };
    const contents = {
      type: RangeType.ListItemContents,
      from: from + 1,
      to: from + line.length - 1,
      lineFrom: {
        line: i,
        index: 1,
      },
      lineTo: {
        line: 1,
        index: line.length,
      },
    };
    context.ranges.push(...[indicator, contents]);
    return [indicator, contents];
  }
  return false;
}
