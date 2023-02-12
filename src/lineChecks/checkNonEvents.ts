import { ParsingContext } from "../ParsingContext";
import { checkComments } from "./checkComments";
import { checkGroupEnd } from "./checkGroupEnd";
import { checkGroupStart } from "./checkGroupStart";
import { checkTags } from "./checkTags";

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
