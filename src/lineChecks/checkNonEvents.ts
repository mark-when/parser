import { Caches } from "../Cache.js";
import { ParsingContext } from "../ParsingContext.js";
import { checkComments } from "./checkComments.js";
import { checkTags } from "./checkTags.js";

export function checkNonEvents(
  line: string,
  i: number,
  lengthAtIndex: number[],
  context: ParsingContext
): boolean {
  return [checkComments, checkTags].some((f) =>
    f(line, i, lengthAtIndex, context)
  );
}
