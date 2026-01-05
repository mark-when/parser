import { Text } from "@codemirror/state";
import { DateTime } from "luxon";
import { linesAndLengths } from "./lines.js";
import { ParsingContext } from "./ParsingContext.js";
import { parseHeader as parseHeaderImpl } from "./parseHeader.js";
import { parsePastHeader } from "./parse.js";
import { Caches } from "./Cache.js";
import { emptyTimeline, type ParseResult } from "./Types.js";

export type ParseTimings = {
  total: number;
  lines: number;
  header: number;
  body: number;
};

const perfNow = () =>
  typeof performance !== "undefined" ? performance.now() : Date.now();

export function profileParse(
  timelineString?: string | string[] | Text,
  cache?: Caches | true,
  now?: DateTime | string
): { parseResult: ParseResult; timings: ParseTimings } {
  const startTotal = perfNow();

  if (cache === true) {
    cache = new Caches();
  }

  if (!timelineString) {
    const total = perfNow() - startTotal;
    return {
      parseResult: { ...emptyTimeline(), cache, parser: { version: "0.0.0" } },
      timings: { total, lines: 0, header: 0, body: 0 },
    };
  }

  const startLines = perfNow();
  const { lines, lengthAtIndex } = linesAndLengths(timelineString);
  const linesMs = perfNow() - startLines;

  const context = new ParsingContext(now, cache);

  const startHeader = perfNow();
  const headerEndLineIndex = parseHeaderImpl(lines, lengthAtIndex, context);
  const headerMs = perfNow() - startHeader;

  const startBody = perfNow();
  parsePastHeader(headerEndLineIndex, context, lines, lengthAtIndex);
  const bodyMs = perfNow() - startBody;

  const parseResult: ParseResult = {
    ...context.toTimeline(),
    cache,
    parser: { version: "0.0.0" },
  };

  const total = perfNow() - startTotal;
  return {
    parseResult,
    timings: { total, lines: linesMs, header: headerMs, body: bodyMs },
  };
}
