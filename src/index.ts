import { DateTime, Duration, Settings } from "luxon";
// import { Sort } from "./Sort";
import { Timeline, DateRangePart, Timelines, emptyTimeline } from "./Types";
import {
  EDTF_START_REGEX,
  EVENT_START_REGEX,
  GROUP_START_REGEX,
  PAGE_BREAK_REGEX,
} from "./regex";
import { getDateRangeFromCasualRegexMatch } from "./dateRange/getDateRangeFromCasualRegexMatch";
import { getDateRangeFromEDTFRegexMatch } from "./dateRange/getDateRangeFromEDTFRegexMatch";
import { Cache } from "./Cache";
import { checkEvent } from "./lineChecks/checkEvent";
import { ParsingContext } from "./ParsingContext";
import { checkNonEvents } from "./lineChecks/checkNonEvents";
import { parseHeader } from "./parseHeader";
import { checkComments } from "./lineChecks/checkComments";
import { checkTagColors } from "./lineChecks/checkTagColors";

export interface ParseOptions {}

export interface Foldable {
  endIndex: number;
  type: "comment" | "section";
  startLine: number;
  startIndex?: number;
  foldStartIndex?: number;
}

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

function checkNewPage(
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

    const completedTimeline = checkNewPage(
      line,
      i,
      startLineIndex,
      lengthAtIndex,
      context
    );
    if (completedTimeline) {
      return completedTimeline;
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
