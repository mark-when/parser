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
import { checkMarkdownSection } from "./lineChecks/checkMarkdownSection.js";
import { Text } from "@codemirror/state";
import { linesAndLengths } from "./lines.js";

// The bump script looks for this line specifically,
// if you edit it you need to edit the bump script as well
const version = "0.16.8";

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
    const possibleSection = checkMarkdownSection(lines, i, lengthAtIndex, context);
    if (possibleSection) {
      i = possibleSection.end;
      continue;
    }
    // Fast skip: event lines must contain a ':' separating date and title; avoid expensive regex if absent
    if (!line.includes(":")) {
      i++;
      continue;
    }
    i = checkEvent(line, lines, i, lengthAtIndex, context) + 1;
  }

  if (to === undefined) {
    const lastLineIndex = i - 1;
    const endPos = lengthAtIndex[lastLineIndex] + lines[lastLineIndex].length;
    const endLineTo = { line: lastLineIndex, index: lines[lastLineIndex].length };
    
    // Close all open sections (tracked by sectionLevels)
    // Each sectionLevel corresponds to a path depth, so we need to pop
    // back to that depth before closing
    while (context.sectionLevels.length > 0) {
      context.sectionLevels.pop();
      
      // The section is at depth equal to current sectionLevels.length
      // (after popping, since sectionLevels[0] = depth 1, etc.)
      // We need to pop currentPath back to that depth, then close the section
      // Note: currentPath has an extra element for "where children go", so we
      // need to account for that (+2 instead of +1)
      const targetDepth = context.sectionLevels.length;
      
      // Pop to the section level (not including events inside)
      // +2 accounts for: +1 for 0-indexing vs depth, +1 for child placeholder
      while (context.currentPath.length > targetDepth + 2) {
        context.currentPath.pop();
      }
      
      context.endCurrentGroup(endPos, endLineTo);
    }
    
    // Close any remaining nested groups (shouldn't happen with pure markdown sections,
    // but keeps backward compatibility)
    while (context.currentPath.length > 1) {
      context.endCurrentGroup(endPos, endLineTo);
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
