import { DateTime, WeekdayNumbers, Zone } from "luxon";
import { ParsingContext } from "../ParsingContext.js";
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
  from_edtfDateTimeMeridiemMinuteMatchIndex,
  to_edtfDateTimeMeridiemMinuteMatchIndex,
  from_edtfRelativeEventIdStartOrEndMatchIndex,
  from_edtfRelativeEventStartOrEndMatchIndex,
  to_edtfRelativeEventIdStartOrEndMatchIndex,
  to_edtfRelativeEventStartOrEndMatchIndex,
  ISO_WEEK_DATE_PART,
} from "../regex.js";
import {
  DateRangePart,
  DateTimeGranularity,
  RelativeDate,
  RangeType,
  Range,
  toDateRange,
  isEvent,
  Path,
  Event,
} from "../Types.js";
import { getTimeFromRegExpMatch, roundDateUp } from "./utils.js";
import { checkEdtfRecurrence } from "./checkRecurrence.js";

const ISO_WEEK_REGEX = new RegExp(`^${ISO_WEEK_DATE_PART}$`, "i");

function parseISOWeekDate(
  raw: string,
  zone: string | Zone
): { dateTime: DateTime; granularity: DateTimeGranularity } | undefined {
  if (!ISO_WEEK_REGEX.test(raw)) {
    return;
  }
  const isoWeekMatch = raw.match(/^(\d{4})-?W(\d{2})(?:-?([1-7]))?$/i);
  if (!isoWeekMatch) {
    return;
  }
  const [, yearPart, weekPart, weekdayPart] = isoWeekMatch;
  const weekYear = parseInt(yearPart, 10);
  const weekNumber = parseInt(weekPart, 10);
  const weekday: WeekdayNumbers = (weekdayPart
    ? parseInt(weekdayPart, 10)
    : 1) as WeekdayNumbers;
  const dateTime = DateTime.fromObject(
    {
      weekYear,
      weekNumber,
      weekday,
    },
    { zone }
  );
  if (!dateTime.isValid) {
    return;
  }
  const granularity: DateTimeGranularity = weekdayPart ? "day" : "week";
  return { dateTime, granularity };
}

export function getDateRangeFromEDTFRegexMatch(
  line: string,
  i: number,
  lengthAtIndex: number[],
  context: ParsingContext
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

  const relativeFromDate =
    eventStartLineRegexMatch[from_edtfRelativeMatchIndex];
  const fromBeforeOrAfter = ["before", "by"].includes(
    relativeFromBeforeOrAfter || ""
  )
    ? "before"
    : "after";
  const relativeToDate = eventStartLineRegexMatch[to_edtfRelativeMatchIndex];

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
  const cached = context.cache?.zone(context.timezone).ranges.get(datePart);
  if (cached) {
    const recurrence = checkEdtfRecurrence(
      line,
      i,
      lengthAtIndex,
      eventStartLineRegexMatch,
      context
    );
    if (recurrence) {
      context.ranges.push(recurrence.range);
    }
    context.ranges.push(colonRange(RangeType.DateRangeColon));
    const dateRange = new DateRangePart({
      from: DateTime.fromISO(cached.fromDateTimeIso, { setZone: true }),
      to: DateTime.fromISO(cached.toDateTimeIso, { setZone: true }),
      originalString: datePart,
      dateRangeInText,
      eventText: eventStartLineRegexMatch[edtfEventTextMatchIndex],
      recurrence,
      isRelative: false,
      definition: {
        ...dateRangeInText,
        type: RangeType.EventDefinition,
        to: lengthAtIndex[i] + colonIndex + 1,
      },
    });
    return dateRange;
  }

  let fromDateTime: DateTime | undefined;
  let endDateTime: DateTime | undefined;
  let granularity: DateTimeGranularity = "instant";

  let canCacheRange = true;
  let isDependent = false;
  let fromRelativeTo: { path: Path; dt: DateTime } | undefined;
  let toRelativeTo: { path: Path; dt: DateTime } | undefined;

  if (edtfFrom) {
    const isoWeekFrom = parseISOWeekDate(edtfFrom, context.timezone);
    if (isoWeekFrom) {
      fromDateTime = isoWeekFrom.dateTime;
      granularity = isoWeekFrom.granularity;
    } else if (edtfFromHasTime) {
      const time = getTimeFromRegExpMatch(
        eventStartLineRegexMatch,
        from_edtfDateTimeMeridiemHourMatchIndex,
        from_edtfDateTimeMeridiemMinuteMatchIndex,
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
    isDependent = true;

    const relativeToEventId =
      eventStartLineRegexMatch[from_edtfRelativeEventIdMatchIndex];

    let dependentOn: { dt: DateTime; event?: Event; path?: Path } | undefined;
    if (relativeToEventId) {
      const event = context.getById(relativeToEventId);
      if (event && isEvent(event)) {
        const range = toDateRange(event.dateRangeIso);
        const startOrEnd =
          eventStartLineRegexMatch[
            from_edtfRelativeEventIdStartOrEndMatchIndex
          ];
        const path = context.ids[relativeToEventId];
        const dt = startOrEnd === "start"
          ? range.fromDateTime
          : startOrEnd === "end"
          ? range.toDateTime
          : fromBeforeOrAfter === "after"
          ? range.toDateTime
          : range.fromDateTime;
          
        fromRelativeTo = { path, dt };
        dependentOn = {
          dt,
          event,
          path,
        };
      } else {
        const index = line.lastIndexOf(
          relativeToEventId,
          dateRangeInText.to + 1
        );
        context.parseMessages.push({
          type: "error",
          message: `Event "${relativeToEventId}" not found`,
          pos: [
            lengthAtIndex[i] + index,
            lengthAtIndex[i] + index + relativeToEventId.length,
          ],
        });
      }
    }

    if (!dependentOn) {
      const priorEvent = context.priorEvent();
      if (!priorEvent) {
        dependentOn = { dt: context.zonedNow };
      } else {
        const startOrEnd =
          eventStartLineRegexMatch[from_edtfRelativeEventStartOrEndMatchIndex];
        const priorRange = toDateRange(priorEvent.dateRangeIso);
        const path = context.currentPath;
        const dt = startOrEnd === "start"
          ? priorRange.fromDateTime
          : startOrEnd === "end"
          ? priorRange.toDateTime
          : fromBeforeOrAfter === "after"
          ? priorRange.toDateTime
          : priorRange.fromDateTime;
          
        fromRelativeTo = { path, dt };
        dependentOn = {
          dt,
          event: priorEvent,
          path,
        };
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
        endDateTime = dependentOn.dt;
        fromRelativeTo = undefined;
        if (dependentOn.path) {
          toRelativeTo = { path: dependentOn.path, dt: dependentOn.dt };
        }
        fromDateTime = RelativeDate.from(
          relativeFromDate,
          dependentOn.dt,
          "minus"
        );
      } else {
        fromDateTime = dependentOn.dt;
        endDateTime = RelativeDate.from(relativeFromDate, dependentOn.dt);
      }
    } else {
      if (fromBeforeOrAfter === "before") {
        if (relativeToDate) {
          // in this case we're actually determining the end dateTime, with its duration,
          // or start time, to be figured out from the eventEndDate
          fromRelativeTo = undefined;
          if (dependentOn.path) {
            toRelativeTo = { path: dependentOn.path, dt: dependentOn.dt };
          }
          endDateTime = RelativeDate.from(
            relativeFromDate,
            dependentOn.dt,
            "minus"
          );
          fromDateTime = RelativeDate.from(
            relativeToDate,
            endDateTime,
            "minus"
          );
        } else {
          // In this case we have an eventEndDate but it is not relative
        }
      } else {
        fromDateTime = RelativeDate.from(relativeFromDate, dependentOn.dt);
      }
    }
    granularity = "instant";
  } else if (nowFrom) {
    fromDateTime = context.zonedNow;
    granularity = "instant";
  } else {
    fromDateTime = DateTime.fromISO(edtfFrom, { zone: context.timezone });
    granularity = "instant";
  }

  if (!fromDateTime || !fromDateTime?.isValid) {
    fromDateTime = context.zonedNow;
    granularity = "instant";
  }

  if (!endDateTime) {
    let dependentOn: { dt: DateTime; event?: Event; path?: Path } | undefined;
    if (relativeToDate) {
      const relativeToEventId =
        eventStartLineRegexMatch[to_edtfRelativeEventIdMatchIndex];
      if (relativeToEventId) {
        const event = context.getById(relativeToEventId);
        if (event && isEvent(event)) {
          // Dependent on other event
          canCacheRange = false;
          isDependent = true;
          const path = context.ids[relativeToEventId];

          const startOrEnd =
            eventStartLineRegexMatch[
              to_edtfRelativeEventIdStartOrEndMatchIndex
            ];
          const relativeToEventDateRange = toDateRange(event.dateRangeIso);
          const dt = startOrEnd === "start"
            ? relativeToEventDateRange.fromDateTime
            : startOrEnd === "end"
            ? relativeToEventDateRange.toDateTime
            : relativeToEventDateRange.fromDateTime;
            
          toRelativeTo = { path, dt };
          dependentOn = {
            dt,
            event,
            path,
          };
        } else {
          const index = line.lastIndexOf(
            relativeToEventId,
            dateRangeInText.to + 1
          );
          context.parseMessages.push({
            type: "error",
            message: `Event "${relativeToEventId}" not found`,
            pos: [
              lengthAtIndex[i] + index,
              lengthAtIndex[i] + index + relativeToEventId.length,
            ],
          });
        }
      }

      if (!dependentOn) {
        const startOrEnd =
          eventStartLineRegexMatch[to_edtfRelativeEventStartOrEndMatchIndex];
        if (startOrEnd) {
          const priorEvent = context.priorEvent();
          if (priorEvent) {
            const range = toDateRange(priorEvent.dateRangeIso);
            const path = context.currentPath;
            const dt = startOrEnd === "start" ? range.fromDateTime : range.toDateTime;
            
            toRelativeTo = { path, dt };
            dependentOn = {
              event: priorEvent,
              dt,
              path,
            };
          } else {
            const lastIndexOfStartOrEnd = line.lastIndexOf(`.${startOrEnd}`);
            context.parseMessages.push({
              type: "error",
              message: `No prior event to reference`,
              pos: [
                lengthAtIndex[i] + lastIndexOfStartOrEnd,
                lengthAtIndex[i] +
                  lastIndexOfStartOrEnd +
                  startOrEnd.length +
                  1,
              ],
            });
          }
        }
      }
      if (!dependentOn) {
        // We do not have an event to refer to by id, use the start of this event
        dependentOn = { dt: fromDateTime };
      }
      endDateTime = RelativeDate.from(relativeToDate, dependentOn.dt);
    } else if (nowTo) {
      endDateTime = context.zonedNow;
      granularity = "instant";
    } else if (edtfTo) {
      const isoWeekTo = parseISOWeekDate(edtfTo, context.timezone);
      if (isoWeekTo) {
        granularity = isoWeekTo.granularity;
        endDateTime = isoWeekTo.granularity === "week"
          ? isoWeekTo.dateTime.plus({ weeks: 1 })
          : isoWeekTo.dateTime.plus({ days: 1 });
      } else if (edtfToHasTime) {
        const time = getTimeFromRegExpMatch(
          eventStartLineRegexMatch,
          to_edtfDateTimeMeridiemHourMatchIndex,
          to_edtfDateTimeMeridiemMinuteMatchIndex,
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
            context
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
          dateTimeIso: fromDateTime.toISO()!,
          granularity,
        },
        context
      ),
      { setZone: true, zone: context.timezone }
    );
  }

  const recurrence = checkEdtfRecurrence(
    line,
    i,
    lengthAtIndex,
    eventStartLineRegexMatch,
    context
  );
  const colon = colonRange(RangeType.DateRangeColon);
  if (recurrence) {
    context.ranges.push(recurrence.range);
  }
  context.ranges.push(colon);
  if (+fromDateTime > +endDateTime) {
    context.parseMessages.push({
      message: "Illogical date range - start time is later than end time",
      type: "error",
      pos: [
        lengthAtIndex[i] + line.indexOf(datePart),
        lengthAtIndex[i] + line.indexOf(datePart) + datePart.length,
      ],
    });
  }
  const dateRange = new DateRangePart({
    from: fromDateTime,
    to: endDateTime,
    originalString: datePart,
    dateRangeInText,
    eventText: eventStartLineRegexMatch[edtfEventTextMatchIndex],
    recurrence,
    isRelative: isDependent,
    fromRelativeTo,
    toRelativeTo,
    definition: {
      ...dateRangeInText,
      type: RangeType.EventDefinition,
      to: colon.to,
    },
  });

  if (canCacheRange) {
    context.cache?.zone(context.timezone).ranges.set(datePart, {
      fromDateTimeIso: fromDateTime.toISO()!,
      toDateTimeIso: endDateTime.toISO()!,
    });
  }

  return dateRange;
}
