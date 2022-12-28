import { ParsingContext } from "../ParsingContext";
import { COMMENT_REGEX } from "../regex";
import { RangeType } from "../Types";

export function checkComments(
  line: string,
  i: number,
  lengthAtIndex: number[],
  context: ParsingContext
): boolean {
  if (line.match(COMMENT_REGEX)) {
    const from = lengthAtIndex[i];
    const to = from + line.length;
    context.ranges.push({
      type: RangeType.Comment,
      from,
      to,
      lineFrom: {
        line: i,
        index: 0,
      },
      lineTo: {
        line: i,
        index: line.length,
      },
    });

    const currentFoldableComment = context.currentFoldableComment();
    if (currentFoldableComment) {
      currentFoldableComment.endIndex = to;
    } else {
      const indexOfSlashes = line.indexOf("//");
      context.startFoldable({
        startIndex: from,
        startLine: i,
        endIndex: to,
        type: "comment",
        foldStartIndex: from + (indexOfSlashes > -1 ? indexOfSlashes + 2 : 0),
      });
    }
    return true;
  } else {
    context.finishFoldableComment(i);
    return false;
  }
}