import { ParsingContext } from "../ParsingContext.js";
import { checkComments } from "./checkComments.js";
import { checkGroupEnd } from "./checkGroupEnd.js";
import { checkGroupStart } from "./checkGroupStart.js";
import { checkTags } from "./checkTags.js";

export function checkNonEvents(
  line: string,
  i: number,
  lengthAtIndex: number[],
  context: ParsingContext
): boolean {
  return [
    checkComments,
    checkTags,
    checkGroupStart,
    checkGroupEnd,
  ].some((f) => f(line, i, lengthAtIndex, context));
}
