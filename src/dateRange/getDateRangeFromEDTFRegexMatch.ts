import { DateTime } from "luxon";
import { ParsingContext } from "../ParsingContext.js";
import { Caches } from "../Cache.js";
import {
  EDTF_START_REGEX,
  edtfDatePartMatchIndex,
  from_edtfDateIndex,
  from_edtfDateMonthPart,
  from_edtfDateDayPart,
  to_edtfIndex,
  to_edtfDateIndex,
  to_edtfDateMonthPart,
  to_edtfDateDayPart,
  from_edtfBeforeOrAfterMatchIndex,
  to_edtfBeforeOrAfterMatchIndex,
  from_edtfRelativeMatchIndex,
  to_edtfRelativeMatchIndex,
  from_edtfNowMatchIndex,
  to_edtfNowMatchIndex,
  from_edtfRelativeEventIdMatchIndex,
  to_edtfRelativeEventIdMatchIndex,
  edtfEventTextMatchIndex,
  from_edtfDateTimePartMatchIndex,
  from_edtfDateTime24HourMinuteMatchIndex,
  from_edtfDateTimeMeridiemMeridiemMatchIndex,
  from_edtfDateTime24HourHourMatchIndex,
  from_edtfDateTimeMeridiemHourMatchIndex,
  to_edtfDateTimePartMatchIndex,
  to_edtfDateTime24HourHourMatchIndex,
  to_edtfDateTime24HourMinuteMatchIndex,
  to_edtfDateTimeMeridiemHourMatchIndex,
  to_edtfDateTimeMeridiemMeridiemMatchIndex,
} from "../regex.js";
import {
  DateRangePart,
  DateTimeGranularity,
  RelativeDate,
  RangeType,
  Range,
  toDateRange,
} from "../Types.js";
import { getPriorEvent, getTimeFromRegExpMatch, roundDateUp } from "./utils.js";
import { checkEdtfRecurrence } from "./checkRecurrence.js";

export function getDateRangeFromEDTFRegexMatch(
  line: string,
  i: number,
  lengthAtIndex: number[],
  context: ParsingContext,
  cache?: Caches
): DateRangePart | undefined {
  const eventStartLineRegexMatch = line.match(EDTF_START_REGEX);
  if (!eventStartLineRegexMatch) {
    return;
  }
  const datePart = eventStartLineRegexMatch[edtfDatePartMatchIndex];

  const edtfFrom = eventStartLineRegexMatch[from_edtfDateIndex];
  const edtfFromHasMonth = !!eventStartLineRegexMatch[from_edtfDateMonthPart];
  const edtfFromHasDay = !!eventStartLineRegexMatch[from_edtfDateDayPart];

  const edtfFromHasTime =
    !!eventStartLineRegexMatch[from_edtfDateTimePartMatchIndex];

  const eventEndDate = eventStartLineRegexMatch[to_edtfIndex];
  const edtfTo = eventStartLineRegexMatch[to_edtfDateIndex];
  const edtfToHasMonth = !!eventStartLineRegexMatch[to_edtfDateMonthPart];
  const edtfToHasDay = !!eventStartLineRegexMatch[to_edtfDateDayPart];

  const edtfToHasTime =
    !!eventStartLineRegexMatch[to_edtfDateTimePartMatchIndex];

  const relativeFromBeforeOrAfter =
    eventStartLineRegexMatch[from_edtfBeforeOrAfterMatchIndex];
  const relativeToBeforeOrAfter =
    eventStartLineRegexMatch[to_edtfBeforeOrAfterMatchIndex];

  const relativeFromDate =
    eventStartLineRegexMatch[from_edtfRelativeMatchIndex];
  const fromBeforeOrAfter = ["before", "by"].includes(
    relativeFromBeforeOrAfter || ""
  )
    ? "before"
    : "after";
  const relativeToDate = eventStartLineRegexMatch[to_edtfRelativeMatchIndex];
  const toBeforeOrAfter = ["before", "by"].includes(
    relativeToBeforeOrAfter || ""
  )
    ? "before"
    : "after";

  const nowFrom = eventStartLineRegexMatch[from_edtfNowMatchIndex];
  const nowTo = eventStartLineRegexMatch[to_edtfNowMatchIndex];

  const indexOfDateRange = line.indexOf(datePart);
  const dateRangeInText: Range = {
    type: RangeType.DateRange,
    from: lengthAtIndex[i] + indexOfDateRange,
    to: lengthAtIndex[i] + indexOfDateRange + datePart.length,
  };
  context.ranges.push(dateRangeInText);

  const colonIndex = line.indexOf(":", indexOfDateRange + datePart.length);
  const colonRange = (rangeType: RangeType) => ({
    type: rangeType,
    from: lengthAtIndex[i] + colonIndex,
    to: lengthAtIndex[i] + colonIndex + 1,
  });
  const cached = cache?.zone(context.timezone).ranges.get(datePart);
  if (cached) {
    const recurrence = checkEdtfRecurrence(
      eventStartLineRegexMatch,
      lengthAtIndex,
      i
    );
    if (recurrence) {
      context.ranges.push(recurrence.range);
      context.ranges.push(colonRange(RangeType.DateRangeColon));
    } else {
      context.ranges.push(colonRange(RangeType.DateRangeColon));
    }
    const dateRange = new DateRangePart(
      DateTime.fromISO(cached.fromDateTimeIso, { setZone: true }),
      DateTime.fromISO(cached.toDateTimeIso, { setZone: true }),
      datePart,
      dateRangeInText,
      eventStartLineRegexMatch[edtfEventTextMatchIndex],
      recurrence
    );
    return dateRange;
  }

  let fromDateTime: DateTime | undefined;
  let endDateTime: DateTime | undefined;
  let granularity: DateTimeGranularity = "instant";

  let canCacheRange = true;

  if (edtfFrom) {
    if (edtfFromHasTime) {
      const time = getTimeFromRegExpMatch(
        eventStartLineRegexMatch,
        from_edtfDateTimeMeridiemHourMatchIndex,
        from_edtfDateTime24HourMinuteMatchIndex,
        from_edtfDateTimeMeridiemMeridiemMatchIndex,
        from_edtfDateTime24HourHourMatchIndex,
        from_edtfDateTime24HourMinuteMatchIndex
      );
      const timeDateTime = DateTime.fromISO(time.dateTimeIso);
      fromDateTime = DateTime.fromISO(edtfFrom.substring(0, 10), {
        zone: context.timezone,
      }).set({
        hour: timeDateTime.hour,
        minute: timeDateTime.minute,
      });
      granularity = time.granularity;
    } else {
      fromDateTime = DateTime.fromISO(edtfFrom, {
        zone: context.timezone,
      });
      granularity = edtfFromHasDay
        ? "day"
        : edtfFromHasMonth
        ? "month"
        : "year";
    }
  } else if (relativeFromDate) {
    // Dependent on other event
    canCacheRange = false;

    const relativeToEventId =
      eventStartLineRegexMatch[from_edtfRelativeEventIdMatchIndex];

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
        relativeTo = context.now;
      } else {
        relativeTo =
          fromBeforeOrAfter === "after"
            ? toDateRange(priorEvent.dateRangeIso).toDateTime
            : toDateRange(priorEvent.dateRangeIso).fromDateTime;
      }
    }

    if (!relativeToDate && !eventEndDate) {
      // We don't have an end date set. Instead of using the relative
      // from date to determine the start time, we're going to use
      // the end time of the previous event as the start and make the
      // duration the provided relative time.

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
  } else if (nowFrom) {
    fromDateTime = context.now.setZone(context.timezone);
    granularity = "instant";
  } else {
    fromDateTime = DateTime.fromISO(edtfFrom, { zone: context.timezone });
    granularity = "instant";
  }

  if (!fromDateTime || !fromDateTime?.isValid) {
    fromDateTime = context.now.setZone(context.timezone);
    granularity = "instant";
  }

  if (!endDateTime) {
    if (relativeToDate) {
      // Dependent on other event
      canCacheRange = false;

      const relativeToEventId =
        eventStartLineRegexMatch[to_edtfRelativeEventIdMatchIndex];
      let relativeTo =
        relativeToEventId &&
        context.ids[relativeToEventId] &&
        toDateRange(context.ids[relativeToEventId].dateRangeIso).toDateTime;
      if (!relativeTo) {
        // We do not have an event to refer to by id, use the start of this event
        relativeTo = fromDateTime;
      }
      endDateTime = RelativeDate.from(relativeToDate, relativeTo);
    } else if (nowTo) {
      endDateTime = context.now.setZone(context.timezone);
      granularity = "instant";
    } else if (edtfTo) {
      if (edtfToHasTime) {
        const time = getTimeFromRegExpMatch(
          eventStartLineRegexMatch,
          to_edtfDateTimeMeridiemHourMatchIndex,
          to_edtfDateTime24HourMinuteMatchIndex,
          to_edtfDateTimeMeridiemMeridiemMatchIndex,
          to_edtfDateTime24HourHourMatchIndex,
          to_edtfDateTime24HourMinuteMatchIndex
        );
        const timeDateTime = DateTime.fromISO(time.dateTimeIso);
        endDateTime = DateTime.fromISO(edtfFrom.substring(0, 10), {
          zone: context.timezone,
        }).set({
          hour: timeDateTime.hour,
          minute: timeDateTime.minute,
        });
      } else {
        endDateTime = DateTime.fromISO(
          roundDateUp(
            {
              dateTimeIso: edtfTo,
              granularity: edtfToHasDay
                ? "day"
                : edtfToHasMonth
                ? "month"
                : "year",
            },
            context,
            cache
          ),
          { setZone: true, zone: context.timezone }
        );
      }
    }
  }

  if (!endDateTime || !endDateTime.isValid) {
    endDateTime = DateTime.fromISO(
      roundDateUp(
        {
          dateTimeIso: fromDateTime.toISO(),
          granularity,
        },
        context,
        cache
      ),
      { setZone: true, zone: context.timezone }
    );
  }

  const recurrence = checkEdtfRecurrence(
    eventStartLineRegexMatch,
    lengthAtIndex,
    i
  );
  if (recurrence) {
    context.ranges.push(recurrence.range);
    context.ranges.push(colonRange(RangeType.DateRangeColon));
  } else {
    context.ranges.push(colonRange(RangeType.DateRangeColon));
  }
  const dateRange = new DateRangePart(
    fromDateTime,
    endDateTime,
    datePart,
    dateRangeInText,
    eventStartLineRegexMatch[edtfEventTextMatchIndex],
    recurrence
  );

  if (canCacheRange) {
    cache?.zone(context.timezone).ranges.set(datePart, {
      fromDateTimeIso: fromDateTime.toISO(),
      toDateTimeIso: endDateTime.toISO(),
    });
  }

  return dateRange;
}
