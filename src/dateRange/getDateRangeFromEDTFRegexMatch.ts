import { DateTime } from "luxon";
import { ParsingContext } from "..";
import { Cache } from "../Cache";
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
} from "../regex";
import {
  DateRangePart,
  DateTimeGranularity,
  RelativeDate,
  RangeType,
  Range,
  toDateRange,
} from "../Types";
import { getPriorEvent, roundDateUp } from "./utils";

export function getDateRangeFromEDTFRegexMatch(
  line: string,
  i: number,
  lengthAtIndex: number[],
  context: ParsingContext,
  cache?: Cache
): DateRangePart | undefined {
  const eventStartLineRegexMatch = line.match(EDTF_START_REGEX);
  if (!eventStartLineRegexMatch) {
    return;
  }
  const datePart = eventStartLineRegexMatch[edtfDatePartMatchIndex];

  const edtfFrom = eventStartLineRegexMatch[from_edtfDateIndex];
  const edtfFromHasMonth = !!eventStartLineRegexMatch[from_edtfDateMonthPart];
  const edtfFromHasDay = !!eventStartLineRegexMatch[from_edtfDateDayPart];

  const eventEndDate = eventStartLineRegexMatch[to_edtfIndex];
  const edtfTo = eventStartLineRegexMatch[to_edtfDateIndex];
  const edtfToHasMonth = !!eventStartLineRegexMatch[to_edtfDateMonthPart];
  const edtfToHasDay = !!eventStartLineRegexMatch[to_edtfDateDayPart];
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

  const cached = cache?.ranges.get(datePart);
  if (cached) {
    const dateRange = new DateRangePart(
      DateTime.fromISO(cached.fromDateTimeIso),
      DateTime.fromISO(cached.toDateTimeIso),
      datePart,
      dateRangeInText
    );
    return dateRange;
  }

  let fromDateTime: DateTime | undefined;
  let endDateTime: DateTime | undefined;
  let granularity: DateTimeGranularity = "instant";

  let canCacheRange = true;

  if (edtfFrom) {
    fromDateTime = DateTime.fromISO(edtfFrom);
    granularity = edtfFromHasDay ? "day" : edtfFromHasMonth ? "month" : "year";
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
    fromDateTime = context.now;
    granularity = "instant";
  } else {
    fromDateTime = DateTime.fromISO(edtfFrom);
    granularity = "instant";
  }

  if (!fromDateTime || !fromDateTime?.isValid) {
    fromDateTime = context.now;
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
      endDateTime = context.now;
      granularity = "instant";
    } else if (edtfTo) {
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
          cache
        )
      );
    }
  }

  if (!endDateTime || !endDateTime.isValid) {
    endDateTime = DateTime.fromISO(
      roundDateUp(
        {
          dateTimeIso: fromDateTime.toISO(),
          granularity,
        },
        cache
      )
    );
  }

  const dateRange = new DateRangePart(
    fromDateTime,
    endDateTime,
    datePart,
    dateRangeInText
  );

  if (canCacheRange && cache) {
    cache.ranges.set(datePart, {
      fromDateTimeIso: fromDateTime.toISO(),
      toDateTimeIso: endDateTime.toISO(),
    });
  }

  return dateRange;
}
