import { DateTime, Zone } from "luxon";
import { ParsingContext } from "../ParsingContext.js";
import {
  EVENT_START_REGEX,
  datePartMatchIndex,
  from_matchIndex,
  to_matchIndex,
  from_relativeMatchIndex,
  from_beforeOrAfterMatchIndex,
  to_relativeMatchIndex,
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
  eventTextMatchIndex,
  from_casualMonthAndDayYearMatchIndex,
  from_casualMonthMonthAbbrMatchIndex,
  from_casualMonthMonthFullMatchIndex,
  from_casualMonthTimeMatchIndex,
  from_casualMonthYearMatchIndex,
  from_dayFirstCasualMonthDayMatchIndex,
  from_dayFirstCasualMonthMonthAbbrMatchIndex,
  from_dayFirstCasualMonthMonthFullMatchIndex,
  from_monthFirstCasualMonthDayMatchIndex,
  from_monthFirstCasualMonthMonthAbbrMatchIndex,
  from_monthFirstCasualMonthMonthFullMatchIndex,
  to_casualMonthAndDayYearMatchIndex,
  to_casualMonthMonthAbbrMatchIndex,
  to_casualMonthMonthFullMatchIndex,
  to_casualMonthYearMatchIndex,
  to_dayFirstCasualMonthDayMatchIndex,
  to_dayFirstCasualMonthMonthAbbrMatchIndex,
  to_dayFirstCasualMonthMonthFullMatchIndex,
  to_monthFirstCasualMonthDayMatchIndex,
  to_monthFirstCasualMonthMonthAbbrMatchIndex,
  to_monthFirstCasualMonthMonthFullMatchIndex,
  to_casualMonthTimeMatchIndex,
  from_relativeEventStartOrEndMatchIndex,
  to_relativeEventIdStartOrEndMatchIndex,
  to_relativeEventStartOrEndMatchIndex,
  from_relativeEventIdStartOrEndMatchIndex,
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
import {
  getTimeFromSlashDateFrom,
  getTimeFromRegExpMatch,
  getTimeFromSlashDateTo,
  parseSlashDate,
  roundDateUp,
  getTimeFromCasualMonthFrom,
  fromCasualDate,
  getTimeFromCasualMonthTo,
} from "./utils.js";
import { checkRecurrence } from "./checkRecurrence.js";

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
    const recurrence = checkRecurrence(
      line,
      i,
      lengthAtIndex,
      eventStartLineRegexMatch,
      context
    );
    if (recurrence) {
      context.ranges.push(recurrence.range);
    }
    const colon = colonRange(RangeType.DateRangeColon);
    context.ranges.push(colon);
    const dateRange = new DateRangePart({
      from: DateTime.fromISO(cached.fromDateTimeIso, { setZone: true }),
      to: DateTime.fromISO(cached.toDateTimeIso, { setZone: true }),
      originalString: datePart,
      dateRangeInText,
      eventText: eventStartLineRegexMatch[eventTextMatchIndex],
      recurrence,
      definition: {
        ...dateRangeInText,
        type: RangeType.EventDefinition,
        to: colon.to,
      },
      isRelative: false,
    });
    return dateRange;
  }

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

  const fromCasual = fromCasualDate(
    eventStartLineRegexMatch,
    context,
    from_monthFirstCasualMonthMonthFullMatchIndex,
    from_monthFirstCasualMonthDayMatchIndex,
    from_casualMonthAndDayYearMatchIndex,
    from_monthFirstCasualMonthMonthAbbrMatchIndex,
    from_dayFirstCasualMonthDayMatchIndex,
    from_dayFirstCasualMonthMonthFullMatchIndex,
    from_dayFirstCasualMonthMonthAbbrMatchIndex,
    from_casualMonthYearMatchIndex,
    from_casualMonthMonthFullMatchIndex,
    from_casualMonthMonthAbbrMatchIndex,
    eventStartLineRegexMatch[from_casualMonthTimeMatchIndex]
      ? getTimeFromCasualMonthFrom(eventStartLineRegexMatch)
      : undefined
  );

  const toCasual = fromCasualDate(
    eventStartLineRegexMatch,
    context,
    to_monthFirstCasualMonthMonthFullMatchIndex,
    to_monthFirstCasualMonthDayMatchIndex,
    to_casualMonthAndDayYearMatchIndex,
    to_monthFirstCasualMonthMonthAbbrMatchIndex,
    to_dayFirstCasualMonthDayMatchIndex,
    to_dayFirstCasualMonthMonthFullMatchIndex,
    to_dayFirstCasualMonthMonthAbbrMatchIndex,
    to_casualMonthYearMatchIndex,
    to_casualMonthMonthFullMatchIndex,
    to_casualMonthMonthAbbrMatchIndex,
    eventStartLineRegexMatch[to_casualMonthTimeMatchIndex]
      ? getTimeFromCasualMonthTo(eventStartLineRegexMatch)
      : undefined
  );

  const slashDateFrom = eventStartLineRegexMatch[from_slashDateFullMatchIndex];
  const slashDateTo = eventStartLineRegexMatch[to_slashDateFullMatchIndex];

  const timeOnlyFrom = eventStartLineRegexMatch[from_timeOnlyMatchIndex];
  const timeOnlyTo = eventStartLineRegexMatch[to_timeOnlyMatchIndex];

  const nowFrom = eventStartLineRegexMatch[from_nowMatchIndex];
  const nowTo = eventStartLineRegexMatch[to_nowMatchIndex];

  let fromDateTime: DateTime | undefined;
  let endDateTime: DateTime | undefined;
  let granularity: DateTimeGranularity = "instant";
  let canCacheRange = true;
  let fromRelativeTo: { path: Path; dt: DateTime } | undefined;
  let toRelativeTo: { path: Path; dt: DateTime } | undefined;

  let isDependent = false;

  if (relativeFromDate) {
    // Dependent on other events
    canCacheRange = false;
    isDependent = true;

    const relativeToEventId =
      eventStartLineRegexMatch[from_relativeEventIdMatchIndex];

    let dependentOn:
      | {
          dt: DateTime;
          event?: Event;
          path?: Path;
        }
      | undefined;
    if (relativeToEventId) {
      const event = context.getById(relativeToEventId);
      if (event && isEvent(event)) {
        const path = context.ids[relativeToEventId];
        const range = toDateRange(event.dateRangeIso);
        const startOrEnd =
          eventStartLineRegexMatch[from_relativeEventIdStartOrEndMatchIndex];
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
        const path = context.currentPath;
        const startOrEnd =
          eventStartLineRegexMatch[from_relativeEventStartOrEndMatchIndex];
        const priorRange = toDateRange(priorEvent.dateRangeIso);
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
  } else if (fromCasual) {
    fromDateTime = DateTime.fromISO(fromCasual.dateTimeIso, {
      setZone: true,
      zone: context.timezone,
    });
    granularity = fromCasual.granularity;
  } else if (slashDateFrom) {
    const timeComponent =
      eventStartLineRegexMatch[from_slashDateTimeMatchIndex];
    let slashPart = slashDateFrom;
    if (timeComponent) {
      slashPart = slashPart
        .substring(0, slashPart.indexOf(timeComponent))
        .trim()
        .replace(/,/g, "");
    }

    const parsed = parseSlashDate(
      slashPart,
      context.header.dateFormat,
      context
    );
    if (parsed) {
      if (timeComponent) {
        const timePart = getTimeFromSlashDateFrom(eventStartLineRegexMatch);
        const timePartDateTime = DateTime.fromISO(timePart.dateTimeIso);
        fromDateTime = DateTime.fromISO(parsed.dateTimeIso, {
          setZone: true,
          zone: context.timezone,
        }).set({
          hour: timePartDateTime.hour,
          minute: timePartDateTime.minute,
        });
        granularity = timePart.granularity;
      } else {
        fromDateTime = DateTime.fromISO(parsed.dateTimeIso, {
          setZone: true,
          zone: context.timezone,
        });
        granularity = parsed.granularity;
      }
    } else {
      context.parseMessages.push({
        type: "error",
        message: "Was supposed to have a slash date but couldn't parse it",
        pos: [dateRangeInText.from, dateRangeInText.to],
      });
    }
  } else if (timeOnlyFrom) {
    // Dependent on previous event
    canCacheRange = false;
    isDependent = true;

    const timeFrom = getTimeFromRegExpMatch(
      eventStartLineRegexMatch,
      from_timeOnlyMeridiemHourMatchIndex,
      from_timeOnlyMeridiemMinuteMatchIndex,
      from_timeOnlyMeridiemMeridiemMatchIndex,
      from_timeOnly24HourHourMatchIndex,
      from_timeOnly24HourMinuteMatchIndex
    );
    const priorEventDate = context.priorEventToDateTime() || context.zonedNow;
    const timeFromIso = DateTime.fromISO(timeFrom.dateTimeIso, {
      setZone: true,
      zone: context.timezone,
    });
    let priorEventWithParsedTime = priorEventDate.set({
      hour: timeFromIso.hour,
      minute: timeFromIso.minute,
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
    fromDateTime = context.zonedNow;
    granularity = "instant";
  } else {
    fromDateTime = DateTime.fromISO(eventStartDate, {
      zone: context.timezone,
      setZone: true,
    });
    granularity = "instant";
  }

  if (!fromDateTime || !fromDateTime.isValid) {
    fromDateTime = context.zonedNow;
    granularity = "instant";
  }

  if (!endDateTime) {
    if (relativeToDate) {
      canCacheRange = false;
      isDependent = true;

      const relativeToEventId =
        eventStartLineRegexMatch[to_relativeEventIdMatchIndex];
      // TODO: Replaec relativeTo with dependentOn
      let dependentOn: { dt: DateTime; event?: Event; path?: Path } | undefined;
      if (relativeToEventId) {
        const event = context.getById(relativeToEventId);
        if (event && isEvent(event)) {
          const startOrEnd =
            eventStartLineRegexMatch[to_relativeEventIdStartOrEndMatchIndex];
          const {
            fromDateTime: relativeEventFromDateTime,
            toDateTime: relativeEventToDateTime,
          } = toDateRange(event.dateRangeIso);
          const path = context.ids[relativeToEventId];
          const dt = startOrEnd === "start"
            ? relativeEventFromDateTime
            : startOrEnd === "end"
            ? relativeEventToDateTime
            : relativeEventFromDateTime;
          
          dependentOn = {
            dt,
            event,
            path,
          };
          toRelativeTo = { path, dt };
        } else {
          context.parseMessages.push({
            type: "error",
            message: `Event "${relativeToEventId}" not found`,
            pos: [
              lengthAtIndex[i] + line.indexOf(relativeToEventId),
              lengthAtIndex[i] +
                line.indexOf(relativeToEventId) +
                relativeToEventId.length,
            ],
          });
        }
      }

      if (!dependentOn) {
        const startOrEnd =
          eventStartLineRegexMatch[to_relativeEventStartOrEndMatchIndex];
        if (startOrEnd) {
          const priorEvent = context.priorEvent();
          if (priorEvent) {
            const range = toDateRange(priorEvent.dateRangeIso);
            const path = context.currentPath;
            const dt = startOrEnd === "start" ? range.fromDateTime : range.toDateTime;
            
            dependentOn = {
              dt,
              event: priorEvent,
              path,
            };
            toRelativeTo = { path, dt };
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
      endDateTime = RelativeDate.from(eventEndDate, dependentOn.dt);
    } else if (toCasual) {
      endDateTime = DateTime.fromISO(roundDateUp(toCasual, context), {
        setZone: true,
        zone: context.timezone,
      });
    } else if (slashDateTo) {
      const timeComponent =
        eventStartLineRegexMatch[to_slashDateTimeMatchIndex];
      let slashPart = slashDateTo;
      if (timeComponent) {
        slashPart = slashPart
          .substring(0, slashPart.indexOf(timeComponent))
          .trim()
          .replace(/,/g, "");
      }

      const parsed = parseSlashDate(
        slashPart,
        context.header.dateFormat,
        context
      );
      if (parsed) {
        if (timeComponent) {
          const parsedFromIso = DateTime.fromISO(parsed.dateTimeIso, {
            setZone: true,
            zone: context.timezone,
          });
          const timePart = getTimeFromSlashDateTo(eventStartLineRegexMatch);
          const timePartFromIso = DateTime.fromISO(timePart.dateTimeIso, {
            setZone: true,
            zone: context.timezone,
          });
          endDateTime = parsedFromIso.set({
            hour: timePartFromIso.hour,
            minute: timePartFromIso.minute,
          });
          endDateTime = DateTime.fromISO(
            roundDateUp(
              {
                dateTimeIso: endDateTime.toISO()!,
                granularity: timePart.granularity,
              },
              context
            ),
            { setZone: true, zone: context.timezone }
          );
        } else {
          endDateTime = DateTime.fromISO(roundDateUp(parsed, context), {
            setZone: true,
            zone: context.timezone,
          });
        }
      } else {
        context.parseMessages.push({
          type: "error",
          message: "Was supposed to have a slash date but couldn't parse it",
          pos: [dateRangeInText.from, dateRangeInText.to],
        });
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
      const timeToIso = DateTime.fromISO(timeTo.dateTimeIso, {
        setZone: true,
        zone: context.timezone,
      });
      let eventStartWithTimeTo = fromDateTime.set({
        hour: timeToIso.hour,
        minute: timeToIso.minute,
      });
      if (eventStartWithTimeTo < fromDateTime) {
        eventStartWithTimeTo = eventStartWithTimeTo.plus({ days: 1 });
      }
      endDateTime = eventStartWithTimeTo;
      granularity = timeTo.granularity;
    } else if (nowTo) {
      endDateTime = context.zonedNow;
      granularity = "instant";
    } else {
      endDateTime = DateTime.fromISO(
        roundDateUp(
          {
            dateTimeIso: eventEndDate,
            granularity: "instant",
          },
          context
        ),
        { setZone: true, zone: context.timezone }
      );
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

  const recurrence = checkRecurrence(
    line,
    i,
    lengthAtIndex,
    eventStartLineRegexMatch,
    context
  );
  if (recurrence) {
    context.ranges.push(recurrence.range);
  }
  const colon = colonRange(RangeType.DateRangeColon);
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
    eventText: eventStartLineRegexMatch[eventTextMatchIndex],
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
