import { ParsingContext } from "..";
import { EDITORS_REGEX } from "../regex";
import { RangeType, Range } from "../Types";

export function checkEditors(
  line: string,
  i: number,
  lengthAtIndex: number[],
  context: ParsingContext
): boolean {
  const editorsMatch = line.match(EDITORS_REGEX);
  if (!editorsMatch) {
    return false;
  }

  const editTagIndex = line.indexOf(editorsMatch[1]);
  context.editors = editorsMatch[2]
    .trim()
    .split(/ |,/)
    .filter((email) => !!email && email.includes("@"));
  context.ranges.push({
    type: RangeType.Edit,
    from: lengthAtIndex[i] + editTagIndex,
    to: lengthAtIndex[i] + editTagIndex + editorsMatch[1].length,
    lineFrom: {
      line: i,
      index: editTagIndex,
    },
    lineTo: {
      line: i,
      index: editTagIndex + editorsMatch[1].length,
    },
  });

  const editorRanges = [] as Range[];
  for (let j = 0; j < context.editors.length; j++) {
    const index = line.indexOf(
      context.editors[j],
      editorRanges.length
        ? editorRanges[editorRanges.length - 1].from - lengthAtIndex[i]
        : 0
    );
    editorRanges.push({
      type: RangeType.Editor,
      from: lengthAtIndex[i] + index,
      to: lengthAtIndex[i] + index + context.editors[j].length,
      lineFrom: {
        line: i,
        index,
      },
      lineTo: {
        line: i,
        index: index + context.editors[j].length,
      },
    });
  }
  context.ranges.push(...editorRanges);
  return true;
}
