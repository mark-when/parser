import { performance } from "perf_hooks";
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

const pkgVersion = process.env.npm_package_version || "0.0.0";

export function profileParse(
  timelineString?: string | string[] | Text,
  cache?: Caches | true,
  now?: DateTime | string
): { parseResult: ParseResult; timings: ParseTimings } {
  const startTotal = performance.now();

  if (cache === true) {
    cache = new Caches();
  }

  if (!timelineString) {
    const total = performance.now() - startTotal;
    return {
      parseResult: { ...emptyTimeline(), cache, parser: { version: pkgVersion } },
      timings: { total, lines: 0, header: 0, body: 0 },
    };
  }

  const startLines = performance.now();
  const { lines, lengthAtIndex } = linesAndLengths(timelineString);
  const linesMs = performance.now() - startLines;

  const context = new ParsingContext(now, cache);

  const startHeader = performance.now();
  const headerEndLineIndex = parseHeaderImpl(lines, lengthAtIndex, context);
  const headerMs = performance.now() - startHeader;

  const startBody = performance.now();
  parsePastHeader(headerEndLineIndex, context, lines, lengthAtIndex);
  const bodyMs = performance.now() - startBody;

  const parseResult: ParseResult = {
    ...context.toTimeline(),
    cache,
    parser: { version: pkgVersion },
  };

  const total = performance.now() - startTotal;
  return { parseResult, timings: { total, lines: linesMs, header: headerMs, body: bodyMs } };
}
