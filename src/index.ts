import { Timeline, DateRangePart, Timelines, emptyTimeline } from "./Types.js";
import { getDateRangeFromCasualRegexMatch } from "./dateRange/getDateRangeFromCasualRegexMatch.js";
import { getDateRangeFromEDTFRegexMatch } from "./dateRange/getDateRangeFromEDTFRegexMatch.js";
import { Cache } from "./Cache.js";
import { checkEvent } from "./lineChecks/checkEvent.js";
import { ParsingContext } from "./ParsingContext.js";
import { checkNonEvents } from "./lineChecks/checkNonEvents.js";
import { parseHeader } from "./parseHeader.js";

export function parseDateRange(
  dateRangeString: string
): DateRangePart | undefined {
  const parsingContext = new ParsingContext();
  let dateRange = getDateRangeFromEDTFRegexMatch(
    dateRangeString,
    0,
    [],
    parsingContext
  );
  if (!dateRange) {
    dateRange = getDateRangeFromCasualRegexMatch(
      dateRangeString,
      0,
      [],
      parsingContext
    );
  }
  return dateRange;
}

export function parse(
  timelineString?: string,
  cache?: Cache | true
): Timelines {
  if (!timelineString) {
    return { timelines: [emptyTimeline()] };
  }

  const lines = timelineString.split("\n");
  let lengthAtIndex: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (i === 0) {
      lengthAtIndex.push(0);
    }
    lengthAtIndex.push(
      1 + lines[i].length + lengthAtIndex[lengthAtIndex.length - 1] || 0
    );
  }
  const timelines = [];
  let index = 0;
  if (cache === true) {
    cache = new Cache();
  }
  do {
    const timeline = parseTimeline(lines, lengthAtIndex, index, cache);
    index = timeline.metadata.endLineIndex + 1;
    timelines.push(timeline);
  } while (index < lines.length);

  return { timelines: timelines, cache };
}

export function parseTimeline(
  lines: string[],
  lengthAtIndex: number[],
  startLineIndex: number = 0,
  cache?: Cache
): Timeline {
  const context = new ParsingContext();

  const headerEndLineIndex = parseHeader(
    lines,
    lengthAtIndex,
    startLineIndex,
    context
  );

  for (let i = headerEndLineIndex; i < lines.length; i++) {
    const line = lines[i];
    if (checkNonEvents(line, i, lengthAtIndex, context)) {
      continue;
    }

    // TODO: Setting i from the result of checkEvent here allows us to not needlessly reparse lines,
    // but also breaks folding of comments under events
    i = checkEvent(line, lines, i, lengthAtIndex, context, cache);
  }

  // if (context.eventSubgroup) {
  //   context.events.push(context.eventSubgroup);
  // }
  return context.toTimeline(
    lengthAtIndex,
    startLineIndex,
    lines.length - 1,
    // As this is the last timeline, return the length of the whole string
    lengthAtIndex[lines.length - 1] + lines[lines.length - 1].length
  );
}
