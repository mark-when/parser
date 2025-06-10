import { getDateRangeFromCasualRegexMatch } from "../dateRange/getDateRangeFromCasualRegexMatch.js";
import { getDateRangeFromEDTFRegexMatch } from "../dateRange/getDateRangeFromEDTFRegexMatch.js";
import { getDateRangeFromBCEDateRegexMatch } from "../dateRange/getDateRangeFromBCEDateRegexMatch.js";
import {
  EDTF_START_REGEX,
  EVENT_START_REGEX,
  BCE_START_REGEX,
  GROUP_START_REGEX,
  GROUP_END_REGEX,
  COMPLETION_REGEX,
} from "../regex.js";
import {
  RangeType,
  EventDescription,
  Event,
  Range,
  DateRangePart,
  Path,
} from "../Types.js";
import { checkComments } from "./checkComments.js";
import { checkListItems } from "./checkListItems.js";
import { ParsingContext } from "../ParsingContext.js";
import { checkTags } from "./checkTags.js";
import { parseZone } from "../zones/parseZone.js";
import { parseProperties } from "../parseHeader.js";

function updateParseMetadata(
  event: Event,
  path: Path,
  dateRange: DateRangePart,
  context: ParsingContext
) {
  if (event.id && !context.ids[event.id]) {
    context.ids[event.id] = [...path];
  }

  if (!context.earliest || dateRange.fromDateTime < context.earliest) {
    context.earliest = dateRange.fromDateTime;
  }
  if (!context.latest || dateRange.toDateTime > context.latest) {
    context.latest = dateRange.toDateTime;
  }
  const eventDuration = +dateRange.toDateTime - +dateRange.fromDateTime;
  if (
    typeof context.maxDuration === "undefined" ||
    eventDuration > context.maxDuration
  ) {
    context.maxDuration = eventDuration;
  }
}

function checkCompletion(
  dateRange: DateRangePart,
  line: string,
  context: ParsingContext
) {
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
      content: completed,
    };
    context.ranges.push(indicator);
  }
  return completed;
}

export function checkEvent(
  line: string,
  lines: string[],
  i: number,
  lengthAtIndex: number[],
  context: ParsingContext
): number {
  let dateRange = getDateRangeFromEDTFRegexMatch(
    line,
    i,
    lengthAtIndex,
    context
  );
  if (!dateRange) {
    dateRange = getDateRangeFromCasualRegexMatch(
      line,
      i,
      lengthAtIndex,
      context
    );
  }
  if (!dateRange) {
    dateRange = getDateRangeFromBCEDateRegexMatch(
      line,
      i,
      lengthAtIndex,
      context
    );
  }
  if (!dateRange) {
    return i;
  }

  const { properties, i: from } = parseProperties(
    lines,
    lengthAtIndex,
    i + 1,
    context
  );

  const matchedListItems = [];
  let end = from - 1;
  let nextLine;

  while (true) {
    nextLine = lines[++end];
    if (
      typeof nextLine !== "string" ||
      nextLine.match(EDTF_START_REGEX) ||
      nextLine.match(EVENT_START_REGEX) ||
      nextLine.match(BCE_START_REGEX) ||
      nextLine.match(GROUP_START_REGEX) ||
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

  const eventGroup = lines.slice(from - 1, end);

  const completed = checkCompletion(dateRange, line, context);

  eventGroup[0] = dateRange.eventText.trim();
  const eventDescription = new EventDescription(
    eventGroup,
    matchedListItems,
    completed
  );

  const tz = properties.find(([k, v]) => k === "tz" || k === "timezone");
  if (tz) {
    if (typeof tz[1] === "string" || typeof tz[1] === "number") {
      const zone = parseZone(tz[1], context.cache);
      if (zone) {
        dateRange.fromDateTime = dateRange.fromDateTime.setZone(zone, {
          keepLocalTime: true,
        });
        dateRange.toDateTime = dateRange.toDateTime.setZone(zone, {
          keepLocalTime: true,
        });
      } else {
        context.parseMessages.push({
          type: "error",
          message: `Unable to parse timezone "${tz[1]}"`,
          pos: [dateRange.dateRangeInText.from, dateRange.dateRangeInText.to],
        });
      }
    } else if (typeof tz[1] === "object" && Array.isArray(tz[1])) {
      const from = tz[1].find(([k]) => k === "from");
      const to = tz[1].find(([k]) => k === "to");
      if (!from && !to) {
        context.parseMessages.push({
          type: "error",
          message:
            "Unable to parse distinct from and to timezones. Specify 'timezone.from' and/or 'timezone.to' to set zones for the start or end of ranges, respectively.",
          pos: [dateRange.dateRangeInText.from, dateRange.dateRangeInText.to],
        });
      }
      if (from) {
        const zone = parseZone(from[1], context.cache);
        if (zone) {
          dateRange.fromDateTime = dateRange.fromDateTime.setZone(zone, {
            keepLocalTime: true,
          });
        } else {
          context.parseMessages.push({
            type: "error",
            message: `Unable to parse 'from' timezone "${from}"`,
            pos: [dateRange.dateRangeInText.from, dateRange.dateRangeInText.to],
          });
        }
      }
      if (to) {
        const zone = parseZone(to[1], context.cache);
        if (zone) {
          dateRange.toDateTime = dateRange.toDateTime.setZone(zone, {
            keepLocalTime: true,
          });
        } else {
          context.parseMessages.push({
            type: "error",
            message: `Unable to parse 'to' timezone "${to}"`,
            pos: [dateRange.dateRangeInText.from, dateRange.dateRangeInText.to],
          });
        }
      }
    } else {
      context.parseMessages.push({
        type: "error",
        message: `Unable to parse timezone "${tz[1]}"`,
        pos: [dateRange.dateRangeInText.from, dateRange.dateRangeInText.to],
      });
    }
  }

  const eventRange: Range = {
    from: lengthAtIndex[i],
    to: lengthAtIndex[end],
    type: RangeType.Event,
  };

  const event = new Event(
    line,
    properties,
    dateRange,
    eventRange,
    dateRange.dateRangeInText,
    eventDescription,
    dateRange.originalString
  );

  if (event) {
    const path = context.push(event);
    updateParseMetadata(event, path, dateRange, context);
    if (end - i > 1 && eventRange.to - lengthAtIndex[i + 1] > 0) {
      context.foldables[lengthAtIndex[i]] = {
        startIndex: lengthAtIndex[i + 1] - 1,
        endIndex: eventRange.to - 1,
        type: "event",
        foldStartIndex: lengthAtIndex[i + 1] - 1,
        startLine: i,
      };
    }
  }
  return end - 1;
}
