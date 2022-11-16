import { ParsingContext } from "..";
import { DATE_FORMAT_REGEX } from "../regex";
import { EUROPEAN_DATE_FORMAT } from "../Types";

export function checkDateFormat(
  line: string,
  i: number,
  lengthAtIndex: number[],
  context: ParsingContext
): boolean {
  if (line.match(DATE_FORMAT_REGEX)) {
    context.dateFormat = EUROPEAN_DATE_FORMAT;
    return true;
  }
  return false;
}
