import { getDateRangeFromCasualRegexMatch } from "../dateRange/getDateRangeFromCasualRegexMatch.js";
import { getDateRangeFromEDTFRegexMatch } from "../dateRange/getDateRangeFromEDTFRegexMatch.js";
import {
  EDTF_START_REGEX,
  EVENT_START_REGEX,
  GROUP_START_REGEX,
  PAGE_BREAK_REGEX,
  GROUP_END_REGEX,
  COMPLETION_REGEX,
} from "../regex.js";
import { RangeType, EventDescription, Event, Range } from "../Types.js";
import { checkComments } from "./checkComments.js";
import { checkListItems } from "./checkListItems.js";
import { Cache } from "../Cache.js";
import { Node } from "../Node.js";
import { ParsingContext } from "../ParsingContext.js";
import { checkTags } from "./checkTags.js";

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
    checkTags(nextLine, end, lengthAtIndex, context);

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

  const completionMatch = dateRange.eventText.match(COMPLETION_REGEX);
  const indexOfEventText = line.indexOf(dateRange.eventText);
  let completed = undefined;
  if (completionMatch) {
    const from =
      indexOfEventText + dateRange.eventText.indexOf(completionMatch[0]);
    const to =
      from +
      dateRange.eventText.indexOf(completionMatch[1]) +
      completionMatch[1].length;
    completed = ["X", "x"].some((x) => completionMatch.includes(x));

    const indicator: Range = {
      type: RangeType.CheckboxItemIndicator,
      from: dateRange.dateRangeInText.from + from,
      to: dateRange.dateRangeInText.from + to,
      lineFrom: {
        line: dateRange.dateRangeInText.lineFrom.line,
        index: from,
      },
      lineTo: {
        line: dateRange.dateRangeInText.lineFrom.line,
        index: to,
      },
      content: completed,
    };
    context.ranges.push(indicator);
  }

  eventGroup[0] = dateRange.eventText.trim();
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
    if (end - i > 1) {
      context.foldables[lengthAtIndex[i]] = {
        startIndex: lengthAtIndex[i + 1] - 1,
        endIndex: lengthAtIndex[end] - 1,
        type: "event",
        foldStartIndex: lengthAtIndex[i + 1] - 1,
        startLine: i,
      };
    }
  }
  return end - 1;
}
