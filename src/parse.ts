import {
  Timeline,
  DateRangePart,
  ParseResult,
  emptyTimeline,
} from "./Types.js";
import { getDateRangeFromCasualRegexMatch } from "./dateRange/getDateRangeFromCasualRegexMatch.js";
import { getDateRangeFromEDTFRegexMatch } from "./dateRange/getDateRangeFromEDTFRegexMatch.js";
import { getDateRangeFromBCEDateRegexMatch } from "./dateRange/getDateRangeFromBCEDateRegexMatch.js";
import { Caches } from "./Cache.js";
import { checkEvent } from "./lineChecks/checkEvent.js";
import { ParseMessage, ParsingContext } from "./ParsingContext.js";
import { checkNonEvents } from "./lineChecks/checkNonEvents.js";
import { parseHeader as _parseHeader } from "./parseHeader.js";
import ICAL from "ical.js";
import { DateTime } from "luxon";
import {
  DateFormap,
  ISOMap,
  dateRangeToString,
} from "./utilities/dateRangeToString.js";
import { checkGroupStart } from "./lineChecks/checkGroupStart.js";
import { Text } from "@codemirror/state";

// The bump script looks for this line specifically,
// if you edit it you need to edit the bump script as well
const version = "0.14.17";

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
  if (!dateRange) {
    dateRange = getDateRangeFromBCEDateRegexMatch(
      dateRangeString,
      0,
      [],
      parsingContext
    );
  }
  return dateRange;
}

const linesAndLengths = (timelineString: string | string[] | Text) => {
  const lines =
    timelineString instanceof Text
      ? timelineString.toJSON()
      : Array.isArray(timelineString)
      ? timelineString
      : timelineString.split("\n");
  let lengthAtIndex: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (i === 0) {
      lengthAtIndex.push(0);
    }
    lengthAtIndex.push(
      (i === lines.length - 1 ? 0 : 1) +
        lines[i].length +
        lengthAtIndex[lengthAtIndex.length - 1] || 0
    );
  }
  return { lines, lengthAtIndex };
};

export function parse(
  timelineString?: string | string[] | Text,
  cache?: Caches | true,
  now?: DateTime | string
): ParseResult {
  if (cache === true) {
    cache = new Caches();
  }
  const parser = {
    version,
  };
  if (!timelineString) {
    return { ...emptyTimeline(), cache, parser, parseMessages: [] };
  }
  const { lines, lengthAtIndex } = linesAndLengths(timelineString);
  return {
    ...parseTimeline(lines, lengthAtIndex, cache, now),
    cache,
    parser,
  };
}

export function parseHeader(timelineString: string) {
  const { lines, lengthAtIndex } = linesAndLengths(timelineString);
  const context = new ParsingContext();
  const headerEndLineIndex = _parseHeader(lines, lengthAtIndex, context);
  return { ...context, lines, lengthAtIndex, headerEndLineIndex };
}

export function parsePastHeader(
  from: number,
  context: ParsingContext,
  lines: string[],
  lengthAtIndex: number[],
  to?: number
) {
  let i = from;
  const upTo = to || lines.length;
  while (i < lines.length && i < upTo) {
    const line = lines[i];
    if (checkNonEvents(line, i, lengthAtIndex, context)) {
      i++;
      continue;
    }
    const possibleGroup = checkGroupStart(lines, i, lengthAtIndex, context);
    if (possibleGroup) {
      i = possibleGroup.end;
      continue;
    }
    i = checkEvent(line, lines, i, lengthAtIndex, context) + 1;
  }

  if (to === undefined) {
    const lastLineIndex = i - 1;
    while (context.currentPath.length > 1) {
      context.endCurrentGroup(
        lengthAtIndex[lastLineIndex] + lines[lastLineIndex].length,
        { line: lastLineIndex, index: lines[lastLineIndex].length }
      );
    }
  }
  return context;
}

export function parseTimeline(
  lines: string[],
  lengthAtIndex: number[],
  cache?: Caches,
  now?: DateTime | string
): Timeline & { parseMessages: ParseMessage[] } {
  const context = new ParsingContext(now, cache);
  const headerEndLineIndex = _parseHeader(lines, lengthAtIndex, context);
  parsePastHeader(headerEndLineIndex, context, lines, lengthAtIndex);
  return context.toTimeline();
}

export function parseICal(
  ical: string,
  options?: {
    output?: "markwhen" | "json";
    formap?: DateFormap;
  }
) {
  let markwhenText = "";
  const icalParse = ICAL.parse(ical);
  const component = new ICAL.Component(icalParse);
  const vevents = component.getAllSubcomponents("vevent");
  for (const vevent of vevents) {
    const event = new ICAL.Event(vevent);

    // @ts-ignore
    const timezone: string =
      component
        .getFirstSubcomponent("vtimezone")
        ?.getFirstPropertyValue("tzid") || "";

    const fromDateTime = timezone
      ? DateTime.fromISO(event.startDate.toString(), { zone: timezone })
      : DateTime.fromMillis(event.startDate.toUnixTime() * 1000);

    const toDateTime = timezone
      ? DateTime.fromISO(event.endDate.toString(), { zone: timezone })
      : DateTime.fromMillis(event.endDate.toUnixTime() * 1000);

    markwhenText += `${dateRangeToString(
      {
        fromDateTime,
        toDateTime,
      },
      options?.formap ?? ISOMap
    )}: ${event.summary}\n`;
    if (event.description) {
      const adjustedDescription = event.description
        .split("\n")
        .map((line) => {
          if (parseDateRange(line)) {
            return `. ${line}`;
          }
          return line;
        })
        .join("\n");
      markwhenText += `${adjustedDescription}\n\n`;
    }
  }
  if (options?.output === "json") {
    const result = parse(markwhenText);
    return result;
  }
  return markwhenText;
}
