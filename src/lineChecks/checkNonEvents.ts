import { ParsingContext } from "../ParsingContext";
import { checkComments } from "./checkComments";
import { checkDateFormat } from "./checkDateFormat";
import { checkDescription } from "./checkDescription";
import { checkEditors } from "./checkEditors";
import { checkGroupEnd } from "./checkGroupEnd";
import { checkGroupStart } from "./checkGroupStart";
import { checkTagColors } from "./checkTagColors";
import { checkTags } from "./checkTags";
import { checkTitle } from "./checkTitle";
import { checkViewers } from "./checkViewers";

export function checkNonEvents(
  line: string,
  i: number,
  lengthAtIndex: number[],
  context: ParsingContext
): boolean {
  return [
    checkComments,
    checkTagColors,
    checkDateFormat,
    checkTitle,
    checkViewers,
    checkEditors,
    checkDescription,
    checkTags,
    checkGroupStart,
    checkGroupEnd,
  ].some((f) => f(line, i, lengthAtIndex, context));
}
