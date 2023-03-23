import { ParsingContext } from "../ParsingContext.js";
import { PAGE_BREAK_REGEX } from "../regex.js";
import { Timeline } from "../Types.js";

export function checkNewPage(
  line: string,
  i: number,
  startLineIndex: number,
  lengthAtIndex: number[],
  context: ParsingContext
): Timeline | undefined {
  if (line.match(PAGE_BREAK_REGEX)) {
    while (context.foldableSections.length) {
      context.finishFoldableSection(i, lengthAtIndex[i] + line.length);
    }
    return context.toTimeline(
      lengthAtIndex,
      startLineIndex,
      i,
      lengthAtIndex[i] - 1
    );
  }
}
