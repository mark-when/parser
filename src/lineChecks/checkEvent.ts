import { getDateRangeFromCasualRegexMatch } from "../dateRange/getDateRangeFromCasualRegexMatch";
import { getDateRangeFromEDTFRegexMatch } from "../dateRange/getDateRangeFromEDTFRegexMatch";
import {
  EDTF_START_REGEX,
  EVENT_START_REGEX,
  GROUP_START_REGEX,
  PAGE_BREAK_REGEX,
  GROUP_END_REGEX,
  COMPLETION_REGEX,
} from "../regex";
import { RangeType, EventDescription, Event, Range } from "../Types";
import { checkComments } from "./checkComments";
import { checkListItems } from "./checkListItems";
import { Cache } from "../Cache";
import { Node } from "../Node";
import { ParsingContext } from "../ParsingContext";

export function checkEvent(
  line: string,
  lines: string[],
  i: number,
  lengthAtIndex: number[],
  context: ParsingContext,
  cache?: Cache
): number {
  let dateRange = getDateRangeFromEDTFRegexMatch(
    line,
    i,
    lengthAtIndex,
    context,
    cache
  );
  if (!dateRange) {
    dateRange = getDateRangeFromCasualRegexMatch(
      line,
      i,
      lengthAtIndex,
      context,
      cache
    );
  }
  if (!dateRange) {
    return i;
  }

  const eventDuration = +dateRange.toDateTime - +dateRange.fromDateTime;
  if (
    typeof context.maxDuration === "undefined" ||
    eventDuration > context.maxDuration
  ) {
    context.maxDuration = eventDuration;
  }

  let end = i;
  let nextLine;

  const matchedListItems = [];
  while (true) {
    nextLine = lines[++end];
    if (
      typeof nextLine !== "string" ||
      nextLine.match(EDTF_START_REGEX) ||
      nextLine.match(EVENT_START_REGEX) ||
      nextLine.match(GROUP_START_REGEX) ||
      nextLine.match(PAGE_BREAK_REGEX) ||
      (context.currentPath.length > 1 && nextLine.match(GROUP_END_REGEX))
    ) {
      break;
    }

    checkComments(nextLine, end, lengthAtIndex, context);
    const listItems = checkListItems(nextLine, end, lengthAtIndex, context);
    if (listItems) {
      matchedListItems.push(...listItems);
    }
  }

  const eventGroup = lines.slice(i, end);

  const eventRange: Range = {
    from: dateRange.dateRangeInText.from,
    to: lengthAtIndex[end],
    type: RangeType.Event,
    lineFrom: {
      line: dateRange.dateRangeInText.lineFrom.line,
      index: dateRange.dateRangeInText.lineFrom.index,
    },
    lineTo: {
      line: i,
      index: line.length,
    },
  };

  // Remove the date part from the first line
  const datePartOfLine = dateRange.originalString!;
  const indexOfDateRange = line.indexOf(datePartOfLine);
  eventGroup[0] = eventGroup[0]
    .substring(indexOfDateRange + datePartOfLine.length + 1)
    .trim();

  const completionMatch = eventGroup[0].match(COMPLETION_REGEX);
  let completed = undefined;
  if (completionMatch) {
    const from = dateRange.dateRangeInText.from + datePartOfLine.length + 1;
    const to =
      eventGroup[0].indexOf(completionMatch[1]) + completionMatch[1].length;
    completed = ["X", "x"].some((x) => completionMatch.includes(x));
    const indicator: Range = {
      type: RangeType.CheckboxItemIndicator,
      from,
      to,
      lineFrom: {
        line: dateRange.dateRangeInText.lineFrom.line,
        index:
          dateRange.dateRangeInText.lineFrom.index + datePartOfLine.length + 1,
      },
      lineTo: {
        line: dateRange.dateRangeInText.lineFrom.line,
        index:
          dateRange.dateRangeInText.lineFrom.index +
          datePartOfLine.length +
          1 +
          completionMatch[1].length,
      },
      content: completed,
    };
    context.ranges.push(indicator);
  }

  const eventDescription = new EventDescription(
    eventGroup,
    matchedListItems,
    completed
  );
  const event = new Event(
    line,
    dateRange,
    eventRange,
    dateRange.dateRangeInText,
    eventDescription,
    dateRange.originalString
  );

  if (event) {
    context.push(new Node(event));

    if (event.eventDescription.id && !context.ids[event.eventDescription.id]) {
      context.ids[event.eventDescription.id] = event;
    }

    if (!context.earliest || dateRange.fromDateTime < context.earliest) {
      context.earliest = dateRange.fromDateTime;
    }
    if (!context.latest || dateRange.toDateTime > context.latest) {
      context.latest = dateRange.toDateTime;
    }
  }
  return end - 1;
}
