import { DateTime } from "luxon";
import { ParsingContext } from "..";
import {
  EVENT_START_REGEX,
  datePartMatchIndex,
  from_matchIndex,
  to_matchIndex,
  from_relativeMatchIndex,
  from_beforeOrAfterMatchIndex,
  to_relativeMatchIndex,
  to_beforeOrAfterMatchIndex,
  from_slashDateFullMatchIndex,
  to_slashDateFullMatchIndex,
  from_timeOnlyMatchIndex,
  to_timeOnlyMatchIndex,
  from_nowMatchIndex,
  to_nowMatchIndex,
  from_relativeEventIdMatchIndex,
  from_slashDateTimeMatchIndex,
  from_timeOnlyMeridiemHourMatchIndex,
  from_timeOnlyMeridiemMinuteMatchIndex,
  from_timeOnlyMeridiemMeridiemMatchIndex,
  from_timeOnly24HourHourMatchIndex,
  from_timeOnly24HourMinuteMatchIndex,
  to_relativeEventIdMatchIndex,
  to_slashDateTimeMatchIndex,
  to_timeOnlyMeridiemHourMatchIndex,
  to_timeOnlyMeridiemMinuteMatchIndex,
  to_timeOnlyMeridiemMeridiemMatchIndex,
  to_timeOnly24HourHourMatchIndex,
  to_timeOnly24HourMinuteMatchIndex,
} from "../regex";
import {
  DateRangePart,
  DateTimeGranularity,
  RelativeDate,
  RangeType,
  Range,
  toDateRange,
} from "../Types";
import {
  fromCasualDateFrom,
  fromCasualDateTo,
  getTimeFromSlashDateFrom,
  getTimeFromRegExpMatch,
  getTimeFromSlashDateTo,
  getPriorEventToDateTime,
  getPriorEvent,
  parseSlashDate,
  roundDateUp,
} from "./utils";

export function getDateRangeFromCasualRegexMatch(
  line: string,
  i: number,
  lengthAtIndex: number[],
  context: ParsingContext
): DateRangePart | undefined {
  const eventStartLineRegexMatch = line.match(EVENT_START_REGEX);
  if (!eventStartLineRegexMatch) {
    return;
  }
  // What the regex matched as the date range part
  const datePart = eventStartLineRegexMatch[datePartMatchIndex];
  const eventStartDate = eventStartLineRegexMatch[from_matchIndex];
  const eventEndDate = eventStartLineRegexMatch[to_matchIndex];

  const relativeFromDate = eventStartLineRegexMatch[from_relativeMatchIndex];
  const relativeFromBeforeOrAfter =
    eventStartLineRegexMatch[from_beforeOrAfterMatchIndex];
  const fromBeforeOrAfter = ["before", "by"].includes(
    relativeFromBeforeOrAfter || ""
  )
    ? "before"
    : "after";
  const relativeToDate = eventStartLineRegexMatch[to_relativeMatchIndex];
  const relativeToBeforeOrAfter =
    eventStartLineRegexMatch[to_beforeOrAfterMatchIndex];
  const toBeforeOrAfter = ["before", "by"].includes(
    relativeToBeforeOrAfter || ""
  )
    ? "before"
    : "after";

  const fromCasual = fromCasualDateFrom(eventStartLineRegexMatch);
  const toCasual = fromCasualDateTo(eventStartLineRegexMatch);

  const slashDateFrom = eventStartLineRegexMatch[from_slashDateFullMatchIndex];
  const slashDateTo = eventStartLineRegexMatch[to_slashDateFullMatchIndex];

  const timeOnlyFrom = eventStartLineRegexMatch[from_timeOnlyMatchIndex];
  const timeOnlyTo = eventStartLineRegexMatch[to_timeOnlyMatchIndex];

  const nowFrom = eventStartLineRegexMatch[from_nowMatchIndex];
  const nowTo = eventStartLineRegexMatch[to_nowMatchIndex];

  let fromDateTime: DateTime | undefined;
  let endDateTime: DateTime | undefined;
  let granularity: DateTimeGranularity = "instant";
  if (relativeFromDate) {
    const relativeToEventId =
      eventStartLineRegexMatch[from_relativeEventIdMatchIndex];

    let relativeTo =
      relativeToEventId &&
      (fromBeforeOrAfter === "after"
        ? context.ids[relativeToEventId]
          ? toDateRange(context.ids[relativeToEventId].dateRangeIso).toDateTime
          : undefined
        : context.ids[relativeToEventId]
        ? toDateRange(context.ids[relativeToEventId].dateRangeIso).fromDateTime
        : undefined);

    if (!relativeTo) {
      const priorEvent = getPriorEvent(context);
      if (!priorEvent) {
        relativeTo = DateTime.now();
      } else {
        relativeTo =
          fromBeforeOrAfter === "after"
            ? toDateRange(priorEvent.dateRangeIso).toDateTime
            : toDateRange(priorEvent.dateRangeIso).fromDateTime;
      }
    }

    if (!relativeToDate && !eventEndDate) {
      if (fromBeforeOrAfter === "before") {
        // In the case of this being a 'before' relative date, the
        // end date is relativeTo and the start date is `amount` before it.
        endDateTime = relativeTo;
        fromDateTime = RelativeDate.from(relativeFromDate, relativeTo, true);
      } else {
        fromDateTime = relativeTo;
        endDateTime = RelativeDate.from(relativeFromDate, relativeTo);
      }
    } else {
      if (fromBeforeOrAfter === "before") {
        if (relativeToDate) {
          // in this case we're actually determining the end dateTime, with its duration,
          // or start time, to be figured out from the eventEndDate
          endDateTime = RelativeDate.from(relativeFromDate, relativeTo, true);
          fromDateTime = RelativeDate.from(relativeToDate, endDateTime, true);
        } else {
          // In this case we have an eventEndDate but it is not relative
        }
      } else {
        fromDateTime = RelativeDate.from(relativeFromDate, relativeTo);
      }
    }
    granularity = "instant";
  } else if (fromCasual) {
    fromDateTime = fromCasual.dateTime;
    granularity = fromCasual.granularity;
  } else if (slashDateFrom) {
    const timeComponent =
      eventStartLineRegexMatch[from_slashDateTimeMatchIndex];
    let slashPart = slashDateFrom;
    if (timeComponent) {
      slashPart = slashPart
        .substring(0, slashPart.indexOf(timeComponent))
        .trim();
    }

    const parsed = parseSlashDate(slashPart, context.dateFormat);
    if (parsed) {
      if (timeComponent) {
        const timePart = getTimeFromSlashDateFrom(eventStartLineRegexMatch);
        fromDateTime = parsed.dateTime.set({
          hour: timePart.dateTime.hour,
          minute: timePart.dateTime.minute,
        });
        granularity = timePart.granularity;
      } else {
        fromDateTime = parsed.dateTime;
        granularity = parsed.granularity;
      }

      // Something non-ISO has come up, assume they want that
      context.preferredInterpolationFormat = context.dateFormat;
    } else {
      console.error("Was supposed to have slash date but couldn't parse it.");
    }
  } else if (timeOnlyFrom) {
    const timeFrom = getTimeFromRegExpMatch(
      eventStartLineRegexMatch,
      from_timeOnlyMeridiemHourMatchIndex,
      from_timeOnlyMeridiemMinuteMatchIndex,
      from_timeOnlyMeridiemMeridiemMatchIndex,
      from_timeOnly24HourHourMatchIndex,
      from_timeOnly24HourMinuteMatchIndex
    );
    const priorEventDate = getPriorEventToDateTime(context) || DateTime.now();
    let priorEventWithParsedTime = priorEventDate.set({
      hour: timeFrom.dateTime.hour,
      minute: timeFrom.dateTime.minute,
    });
    if (priorEventWithParsedTime < priorEventDate) {
      priorEventWithParsedTime = priorEventWithParsedTime.plus({ days: 1 });
      fromDateTime = priorEventWithParsedTime;
      granularity = timeFrom.granularity;
    } else {
      fromDateTime = priorEventWithParsedTime;
      granularity = timeFrom.granularity;
    }
  } else if (nowFrom) {
    fromDateTime = DateTime.now();
    granularity = "instant";
  } else {
    fromDateTime = DateTime.fromISO(eventStartDate);
    granularity = "instant";
  }

  if (!fromDateTime || !fromDateTime.isValid) {
    fromDateTime = DateTime.now();
    granularity = "instant";
  }

  if (!endDateTime) {
    if (relativeToDate) {
      const relativeToEventId =
        eventStartLineRegexMatch[to_relativeEventIdMatchIndex];
      let relativeTo =
        relativeToEventId &&
        context.ids[relativeToEventId] &&
        toDateRange(context.ids[relativeToEventId].dateRangeIso).toDateTime;
      if (!relativeTo) {
        // We do not have an event to refer to by id, use the start of this event
        relativeTo = fromDateTime;
      }
      endDateTime = RelativeDate.from(eventEndDate, relativeTo);
    } else if (toCasual) {
      endDateTime = roundDateUp(toCasual);
    } else if (slashDateTo) {
      const timeComponent =
        eventStartLineRegexMatch[to_slashDateTimeMatchIndex];
      let slashPart = slashDateTo;
      if (timeComponent) {
        slashPart = slashPart.substring(0, slashPart.indexOf(timeComponent));
      }

      const parsed = parseSlashDate(slashPart, context.dateFormat);
      if (parsed) {
        if (timeComponent) {
          const timePart = getTimeFromSlashDateTo(eventStartLineRegexMatch);
          endDateTime = parsed.dateTime.set({
            hour: timePart.dateTime.hour,
            minute: timePart.dateTime.minute,
          });
          endDateTime = roundDateUp({
            dateTime: endDateTime,
            granularity: timePart.granularity,
          });
        } else {
          endDateTime = roundDateUp(parsed);
        }

        // Something non-ISO has come up, assume they want that
        context.preferredInterpolationFormat = context.dateFormat;
      } else {
        console.error("Was supposed to have slash date but couldn't parse it.");
      }
    } else if (timeOnlyTo) {
      const timeTo = getTimeFromRegExpMatch(
        eventStartLineRegexMatch,
        to_timeOnlyMeridiemHourMatchIndex,
        to_timeOnlyMeridiemMinuteMatchIndex,
        to_timeOnlyMeridiemMeridiemMatchIndex,
        to_timeOnly24HourHourMatchIndex,
        to_timeOnly24HourMinuteMatchIndex
      );
      let eventStartWithTimeTo = fromDateTime.set({
        hour: timeTo.dateTime.hour,
        minute: timeTo.dateTime.minute,
      });
      if (eventStartWithTimeTo < fromDateTime) {
        eventStartWithTimeTo = eventStartWithTimeTo.plus({ days: 1 });
      }
      endDateTime = eventStartWithTimeTo;
      granularity = timeTo.granularity;
    } else if (nowTo) {
      endDateTime = DateTime.now();
      granularity = "instant";
    } else {
      endDateTime = roundDateUp({
        dateTime: DateTime.fromISO(eventEndDate),
        granularity: "instant",
      });
    }
  }
  if (!endDateTime || !endDateTime.isValid) {
    endDateTime = roundDateUp({
      dateTime: fromDateTime,
      granularity,
    });
  }

  const indexOfDateRange = line.indexOf(datePart);
  const dateRangeInText: Range = {
    type: RangeType.DateRange,
    from: lengthAtIndex[i] + indexOfDateRange,
    to: lengthAtIndex[i] + indexOfDateRange + datePart.length + 1,
    lineFrom: {
      line: i,
      index: indexOfDateRange,
    },
    lineTo: {
      line: i,
      index: indexOfDateRange + datePart.length + 1,
    },
  };
  context.ranges.push(dateRangeInText);

  const dateRange = new DateRangePart(
    fromDateTime,
    endDateTime,
    datePart,
    dateRangeInText
  );
  return dateRange;
}
