import { DateTime } from "luxon";
import {
  edtf_recurrence_recurrenceAmountDaysUnitMatchIndex,
  edtf_recurrence_recurrenceAmountHoursUnitMatchIndex,
  edtf_recurrence_recurrenceAmountMatchIndex,
  edtf_recurrence_recurrenceAmountMillisecondsUnitMatchIndex,
  edtf_recurrence_recurrenceAmountMinutesUnitMatchIndex,
  edtf_recurrence_recurrenceAmountMonthsUnitMatchIndex,
  edtf_recurrence_recurrenceAmountSecondsUnitMatchIndex,
  edtf_recurrence_recurrenceAmountWeekDayMatchIndex,
  edtf_recurrence_recurrenceAmountWeeksUnitMatchIndex,
  edtf_recurrence_recurrenceAmountXNotationAmountMatchIndex,
  edtf_recurrence_recurrenceAmountYearsUnitMatchIndex,
  edtf_recurrenceMatchIndex,
  edtf_recurrence_repetitionsForAmountAmountMatchIndex,
  edtf_recurrence_repetitionsForAmountDaysUnitMatchIndex,
  edtf_recurrence_repetitionsForAmountHoursUnitMatchIndex,
  edtf_recurrence_repetitionsForAmountMatchIndex,
  edtf_recurrence_repetitionsForAmountMillisecondsUnitMatchIndex,
  edtf_recurrence_repetitionsForAmountMinutesUnitMatchIndex,
  edtf_recurrence_repetitionsForAmountMonthsUnitMatchIndex,
  edtf_recurrence_repetitionsForAmountSecondsUnitMatchIndex,
  edtf_recurrence_repetitionsForAmountTimesMatchIndex,
  edtf_recurrence_repetitionsForAmountWeekDayMatchIndex,
  edtf_recurrence_repetitionsForAmountWeeksUnitMatchIndex,
  edtf_recurrence_repetitionsForAmountYearsUnitMatchIndex,
  edtf_recurrence_repetitionsMatchIndex,
  recurrence_recurrenceAmountDaysUnitMatchIndex,
  recurrence_recurrenceAmountHoursUnitMatchIndex,
  recurrence_recurrenceAmountMatchIndex,
  recurrence_recurrenceAmountMillisecondsUnitMatchIndex,
  recurrence_recurrenceAmountMinutesUnitMatchIndex,
  recurrence_recurrenceAmountMonthsUnitMatchIndex,
  recurrence_recurrenceAmountSecondsUnitMatchIndex,
  recurrence_recurrenceAmountWeekDayMatchIndex,
  recurrence_recurrenceAmountWeeksUnitMatchIndex,
  recurrence_recurrenceAmountXNotationAmountMatchIndex,
  recurrence_recurrenceAmountYearsUnitMatchIndex,
  recurrence_recurrenceMatchIndex,
  recurrence_repetitionsForAmountAmountMatchIndex,
  recurrence_repetitionsForAmountDaysUnitMatchIndex,
  recurrence_repetitionsForAmountHoursUnitMatchIndex,
  recurrence_repetitionsForAmountMatchIndex,
  recurrence_repetitionsForAmountMillisecondsUnitMatchIndex,
  recurrence_repetitionsForAmountMinutesUnitMatchIndex,
  recurrence_repetitionsForAmountMonthsUnitMatchIndex,
  recurrence_repetitionsForAmountSecondsUnitMatchIndex,
  recurrence_repetitionsForAmountTimesMatchIndex,
  recurrence_repetitionsForAmountWeekDayMatchIndex,
  recurrence_repetitionsForAmountWeeksUnitMatchIndex,
  recurrence_repetitionsForAmountYearsUnitMatchIndex,
  recurrence_repetitionsMatchIndex,
  edtf_recurrence_untilMatchIndex,
  edtf_recurrence_untilDateIndex,
  edtf_recurrence_untilDateTimePartMatchIndex,
  edtf_recurrence_untilRelativeMatchIndex,
  edtf_recurrence_untilNowMatchIndex,
  edtf_recurrence_untilDateTimeMeridiemHourMatchIndex,
  edtf_recurrence_untilDateTimeMeridiemMinuteMatchIndex,
  edtf_recurrence_untilDateTimeMeridiemMeridiemMatchIndex,
  edtf_recurrence_untilDateTime24HourHourMatchIndex,
  edtf_recurrence_untilDateTime24HourMinuteMatchIndex,
  edtf_recurrence_untilRelativeEventIdMatchIndex,
  recurrence_untilMatchIndex,
  reccurence_untilDateMatchIndex,
  reccurence_until_relativeMatchIndex,
  reccurence_until_casualMonthMonthFullMatchIndex,
  reccurence_until_casualMonthAndDayYearMatchIndex,
  reccurence_until_monthFirstCasualMonthDayMatchIndex,
  reccurence_until_monthFirstCasualMonthMonthAbbrMatchIndex,
  reccurence_until_monthFirstCasualMonthMonthFullMatchIndex,
  reccurence_until_casualMonthYearMatchIndex,
  reccurence_until_dayFirstCasualMonthDayMatchIndex,
  reccurence_until_dayFirstCasualMonthMonthAbbrMatchIndex,
  reccurence_until_dayFirstCasualMonthMonthFullMatchIndex,
  reccurence_until_casualMonthMonthAbbrMatchIndex,
  reccurence_until_casualMonthTimeMatchIndex,
  reccurence_until_casualMonthTime24HourHourMatchIndex,
  reccurence_until_casualMonthTime24HourMinuteMatchIndex,
  reccurence_until_casualMonthTimeMeridiemHourMatchIndex,
  reccurence_until_casualMonthTimeMeridiemMeridiemMatchIndex,
  reccurence_until_casualMonthTimeMeridiemMinuteMatchIndex,
  reccurence_until_nowMatchIndex,
  reccurence_until_slashDateFullMatchIndex,
  reccurence_until_timeOnlyMatchIndex,
  reccurence_until_relativeEventIdMatchIndex,
  reccurence_until_slashDateTimeMatchIndex,
  reccurence_until_slashDateTime24HourHourMatchIndex,
  reccurence_until_slashDateTime24HourMinuteMatchIndex,
  reccurence_until_slashDateTimeMeridiemHourMatchIndex,
  reccurence_until_slashDateTimeMeridiemMeridiemMatchIndex,
  reccurence_until_slashDateTimeMeridiemMinuteMatchIndex,
  reccurence_until_timeOnly24HourHourMatchIndex,
  reccurence_until_timeOnly24HourMinuteMatchIndex,
  reccurence_until_timeOnlyMeridiemHourMatchIndex,
  reccurence_until_timeOnlyMeridiemMeridiemMatchIndex,
  reccurence_until_timeOnlyMeridiemMinuteMatchIndex,
} from "../regex.js";
import { DateTimeIso, Range, RangeType, toDateRange } from "../Types.js";
import { ParsingContext } from "../ParsingContext.js";
import { Caches } from "../Cache.js";
import {
  fromCasualDate,
  getPriorEvent,
  getPriorEventToDateTime,
  getTimeFromRegExpMatch,
  parseSlashDate,
} from "./utils.js";

export type DurationUnit =
  | "years"
  | "months"
  | "weeks"
  | "weekdays"
  | "days"
  | "hours"
  | "minutes"
  | "seconds"
  | "milliseconds";

export type Duration = Partial<Record<DurationUnit, number>>;

export interface RecurrenceInText {
  recurrence: Recurrence;
  range: Range;
}
export interface Recurrence {
  every: Duration;
  for?: Duration & { times?: number };
  til?: DateTimeIso;
}
export const recurrenceDurationUnits = [
  "years",
  "months",
  "weeks",
  "weekdays",
  "days",
  "hours",
  "minutes",
  "seconds",
  "milliseconds",
] as DurationUnit[];

function getEdtfTil(
  line: string,
  i: number,
  lengthAtIndex: number[],
  eventStartLineRegexMatch: RegExpMatchArray,
  context: ParsingContext
): DateTime | undefined {
  let til: DateTime | undefined;
  const tilMatch = eventStartLineRegexMatch[edtf_recurrence_untilMatchIndex];
  if (!tilMatch) {
    return til;
  }
  const datePart = eventStartLineRegexMatch[edtf_recurrence_untilDateIndex];
  const hasTime =
    !!eventStartLineRegexMatch[edtf_recurrence_untilDateTimePartMatchIndex];
  const relativeDate =
    eventStartLineRegexMatch[edtf_recurrence_untilRelativeMatchIndex];
  const now = eventStartLineRegexMatch[edtf_recurrence_untilNowMatchIndex];

  const textRange = (tilSegmentString: string) => {
    const indexOfDatePart = line.indexOf(
      tilSegmentString,
      line.indexOf(tilMatch)
    );
    const dateRangeInText: Range = {
      type: RangeType.RecurrenceTilDate,
      from: lengthAtIndex[i] + indexOfDatePart,
      to: lengthAtIndex[i] + indexOfDatePart + tilSegmentString.length,
    };
    return dateRangeInText;
  };

  if (datePart) {
    if (hasTime) {
      const time = getTimeFromRegExpMatch(
        eventStartLineRegexMatch,
        edtf_recurrence_untilDateTimeMeridiemHourMatchIndex,
        edtf_recurrence_untilDateTimeMeridiemMinuteMatchIndex,
        edtf_recurrence_untilDateTimeMeridiemMeridiemMatchIndex,
        edtf_recurrence_untilDateTime24HourHourMatchIndex,
        edtf_recurrence_untilDateTime24HourMinuteMatchIndex
      );
      const timeDateTime = DateTime.fromISO(time.dateTimeIso);
      til = DateTime.fromISO(datePart.substring(0, 10), {
        zone: context.timezone,
      }).set({
        hour: timeDateTime.hour,
        minute: timeDateTime.minute,
      });
    } else {
      til = DateTime.fromISO(datePart, {
        zone: context.timezone,
      });
    }
    context.ranges.push(textRange(datePart));
  } else if (relativeDate) {
    const relativeToEventId =
      eventStartLineRegexMatch[edtf_recurrence_untilRelativeEventIdMatchIndex];
    let relativeTo =
      relativeToEventId && context.ids[relativeToEventId]
        ? toDateRange(context.ids[relativeToEventId].dateRangeIso).fromDateTime
        : undefined;
    if (!relativeTo) {
      const priorEvent = getPriorEvent(context);
      if (!priorEvent) {
        relativeTo = context.zonedNow;
      } else {
        relativeTo = toDateRange(priorEvent.dateRangeIso).fromDateTime;
      }
    }
    til = relativeTo;
    context.ranges.push(textRange(relativeDate));
  } else if (now) {
    til = context.zonedNow;
    context.ranges.push(textRange(now));
  } else {
    til = DateTime.fromISO(datePart);
    context.ranges.push(textRange(datePart));
  }

  if (!til || !til.isValid) {
    return undefined;
  }
  return til;
}

export const checkEdtfRecurrence = (
  line: string,
  i: number,
  lengthAtIndex: number[],
  eventStartLineRegexMatch: RegExpMatchArray,
  context: ParsingContext,
  cache?: Caches
): RecurrenceInText | undefined => {
  const recurrenceMatch = eventStartLineRegexMatch[edtf_recurrenceMatchIndex];

  if (!recurrenceMatch) {
    return;
  }

  const indexInString = eventStartLineRegexMatch[0].indexOf(recurrenceMatch);
  const range: Range = {
    type: RangeType.Recurrence,
    from: lengthAtIndex[i] + indexInString,
    to: lengthAtIndex[i] + indexInString + recurrenceMatch.length,
    content: recurrenceMatch,
  };

  let recurrenceCount: number;
  const recurrenceAmountString =
    eventStartLineRegexMatch[edtf_recurrence_recurrenceAmountMatchIndex];
  if (recurrenceAmountString) {
    if (recurrenceAmountString.trim().toLowerCase() === "other") {
      recurrenceCount = 2;
    } else {
      recurrenceCount = parseInt(recurrenceAmountString.trim());
    }
  } else {
    recurrenceCount = 1;
  }

  const recurrenceUnitIndex = [
    edtf_recurrence_recurrenceAmountYearsUnitMatchIndex,
    edtf_recurrence_recurrenceAmountMonthsUnitMatchIndex,
    edtf_recurrence_recurrenceAmountWeeksUnitMatchIndex,
    edtf_recurrence_recurrenceAmountWeekDayMatchIndex,
    edtf_recurrence_recurrenceAmountDaysUnitMatchIndex,
    edtf_recurrence_recurrenceAmountHoursUnitMatchIndex,
    edtf_recurrence_recurrenceAmountMinutesUnitMatchIndex,
    edtf_recurrence_recurrenceAmountSecondsUnitMatchIndex,
    edtf_recurrence_recurrenceAmountMillisecondsUnitMatchIndex,
  ].findIndex((regex) => !!eventStartLineRegexMatch[regex])!;

  const unit = recurrenceDurationUnits[recurrenceUnitIndex];
  const every = {
    [unit]: recurrenceCount,
  } as Duration;

  const til = getEdtfTil(
    line,
    i,
    lengthAtIndex,
    eventStartLineRegexMatch,
    context
  );

  if (eventStartLineRegexMatch[edtf_recurrence_repetitionsMatchIndex]) {
    if (
      eventStartLineRegexMatch[edtf_recurrence_repetitionsForAmountMatchIndex]
    ) {
      const repetitionCount = parseInt(
        eventStartLineRegexMatch[
          edtf_recurrence_repetitionsForAmountAmountMatchIndex
        ].trim()
      );

      const units = [...recurrenceDurationUnits, "times"] as (
        | DurationUnit
        | "times"
      )[];
      const repeitionUnitIndex = [
        edtf_recurrence_repetitionsForAmountYearsUnitMatchIndex,
        edtf_recurrence_repetitionsForAmountMonthsUnitMatchIndex,
        edtf_recurrence_repetitionsForAmountWeeksUnitMatchIndex,
        edtf_recurrence_repetitionsForAmountWeekDayMatchIndex,
        edtf_recurrence_repetitionsForAmountDaysUnitMatchIndex,
        edtf_recurrence_repetitionsForAmountHoursUnitMatchIndex,
        edtf_recurrence_repetitionsForAmountMinutesUnitMatchIndex,
        edtf_recurrence_repetitionsForAmountSecondsUnitMatchIndex,
        edtf_recurrence_repetitionsForAmountMillisecondsUnitMatchIndex,
        edtf_recurrence_repetitionsForAmountTimesMatchIndex,
      ].findIndex((regex) => eventStartLineRegexMatch[regex])!;
      const repetitionUnit = units[repeitionUnitIndex];
      return {
        recurrence: {
          every,
          for: {
            [repetitionUnit]: repetitionCount,
          },
          til: til?.toISO(),
        },
        range,
      };
    } else {
      const repetitionCount = parseInt(
        eventStartLineRegexMatch[
          edtf_recurrence_recurrenceAmountXNotationAmountMatchIndex
        ].trim()
      );
      return {
        recurrence: {
          every,
          for: {
            times: repetitionCount,
          },
          til: til?.toISO(),
        },
        range,
      };
    }
  }
  return { recurrence: { every, til: til?.toISO() }, range };
};

function getTil(
  line: string,
  i: number,
  lengthAtIndex: number[],
  eventStartLineRegexMatch: RegExpMatchArray,
  context: ParsingContext
): DateTime | undefined {
  const tilMatch = eventStartLineRegexMatch[recurrence_untilMatchIndex];
  if (!tilMatch) {
    return;
  }

  const textRange = (tilSegmentString: string) => {
    const indexOfDatePart = line.indexOf(
      tilSegmentString,
      line.indexOf(tilMatch)
    );
    const dateRangeInText: Range = {
      type: RangeType.RecurrenceTilDate,
      from: lengthAtIndex[i] + indexOfDatePart,
      to: lengthAtIndex[i] + indexOfDatePart + tilSegmentString.length,
    };
    return dateRangeInText;
  };

  const datePart = eventStartLineRegexMatch[reccurence_untilDateMatchIndex];
  const relativeDate =
    eventStartLineRegexMatch[reccurence_until_relativeMatchIndex];
  const casual = fromCasualDate(
    eventStartLineRegexMatch,
    context,
    reccurence_until_monthFirstCasualMonthMonthFullMatchIndex,
    reccurence_until_monthFirstCasualMonthDayMatchIndex,
    reccurence_until_casualMonthAndDayYearMatchIndex,
    reccurence_until_monthFirstCasualMonthMonthAbbrMatchIndex,
    reccurence_until_dayFirstCasualMonthDayMatchIndex,
    reccurence_until_dayFirstCasualMonthMonthFullMatchIndex,
    reccurence_until_dayFirstCasualMonthMonthAbbrMatchIndex,
    reccurence_until_casualMonthYearMatchIndex,
    reccurence_until_casualMonthMonthFullMatchIndex,
    reccurence_until_casualMonthMonthAbbrMatchIndex,
    eventStartLineRegexMatch[reccurence_until_casualMonthTimeMatchIndex]
      ? getTimeFromRegExpMatch(
          eventStartLineRegexMatch,
          reccurence_until_casualMonthTimeMeridiemHourMatchIndex,
          reccurence_until_casualMonthTimeMeridiemMinuteMatchIndex,
          reccurence_until_casualMonthTimeMeridiemMeridiemMatchIndex,
          reccurence_until_casualMonthTime24HourHourMatchIndex,
          reccurence_until_casualMonthTime24HourMinuteMatchIndex
        )
      : undefined
  );
  const slashDate =
    eventStartLineRegexMatch[reccurence_until_slashDateFullMatchIndex];
  const timeOnly =
    eventStartLineRegexMatch[reccurence_until_timeOnlyMatchIndex];
  const now = eventStartLineRegexMatch[reccurence_until_nowMatchIndex];

  const ifValid = (dt: DateTime) => (dt.isValid ? dt : context.zonedNow);
  if (relativeDate) {
    const relativeToEventId =
      eventStartLineRegexMatch[reccurence_until_relativeEventIdMatchIndex];
    let relativeTo =
      relativeToEventId && context.ids[relativeToEventId]
        ? toDateRange(context.ids[relativeToEventId].dateRangeIso).fromDateTime
        : undefined;

    if (!relativeTo) {
      const priorEvent = getPriorEvent(context);
      if (!priorEvent) {
        relativeTo = context.zonedNow;
      } else {
        relativeTo = toDateRange(priorEvent.dateRangeIso).fromDateTime;
      }
    }
    context.ranges.push(textRange(relativeDate));
    return ifValid(relativeTo);
  }

  if (casual) {
    const til = DateTime.fromISO(casual.dateTimeIso, {
      setZone: true,
      zone: context.timezone,
    });
    // TODO: text range for this match
    return ifValid(til);
  }

  if (slashDate) {
    const timeComponent =
      eventStartLineRegexMatch[reccurence_until_slashDateTimeMatchIndex];
    let slashPart = slashDate;
    if (timeComponent) {
      slashPart = slashPart
        .substring(0, slashPart.indexOf(timeComponent))
        .trim();
    }
    const parsed = parseSlashDate(
      slashPart,
      context.header.dateFormat,
      context
    );
    if (parsed) {
      context.ranges.push(textRange(slashDate));
      if (timeComponent) {
        const timePart = getTimeFromRegExpMatch(
          eventStartLineRegexMatch,
          reccurence_until_slashDateTimeMeridiemHourMatchIndex,
          reccurence_until_slashDateTimeMeridiemMinuteMatchIndex,
          reccurence_until_slashDateTimeMeridiemMeridiemMatchIndex,
          reccurence_until_slashDateTime24HourHourMatchIndex,
          reccurence_until_slashDateTime24HourMinuteMatchIndex
        );
        const timePartDateTime = DateTime.fromISO(timePart.dateTimeIso);
        const til = DateTime.fromISO(parsed.dateTimeIso, {
          setZone: true,
          zone: context.timezone,
        }).set({
          hour: timePartDateTime.hour,
          minute: timePartDateTime.minute,
        });
        return ifValid(til);
      } else {
        return ifValid(
          DateTime.fromISO(parsed.dateTimeIso, {
            setZone: true,
            zone: context.timezone,
          })
        );
      }
    } else {
      console.error(
        "was supposed to have slash date but couldn't parse it",
        slashDate
      );
      return;
    }
  }

  if (timeOnly) {
    const timeFrom = getTimeFromRegExpMatch(
      eventStartLineRegexMatch,
      reccurence_until_timeOnlyMeridiemHourMatchIndex,
      reccurence_until_timeOnlyMeridiemMinuteMatchIndex,
      reccurence_until_timeOnlyMeridiemMeridiemMatchIndex,
      reccurence_until_timeOnly24HourHourMatchIndex,
      reccurence_until_timeOnly24HourMinuteMatchIndex
    );
    const priorEventDate = getPriorEventToDateTime(context) || context.zonedNow;
    const timeFromIso = DateTime.fromISO(timeFrom.dateTimeIso, {
      setZone: true,
      zone: context.timezone,
    });
    let priorEventWithParsedTime = priorEventDate.set({
      hour: timeFromIso.hour,
      minute: timeFromIso.minute,
    });
    context.ranges.push(textRange(timeOnly));
    return ifValid(
      priorEventWithParsedTime < priorEventDate
        ? priorEventWithParsedTime.plus({ days: 1 })
        : priorEventWithParsedTime
    );
  }

  if (now) {
    context.ranges.push(textRange(now));
    return context.zonedNow;
  }
}

export const checkRecurrence = (
  line: string,
  i: number,
  lengthAtIndex: number[],
  eventStartLineRegexMatch: RegExpMatchArray,
  context: ParsingContext,
  cache?: Caches
): RecurrenceInText | undefined => {
  const recurrenceMatch =
    eventStartLineRegexMatch[recurrence_recurrenceMatchIndex];
  if (!recurrenceMatch) {
    return;
  }

  const indexInString = eventStartLineRegexMatch[0].indexOf(recurrenceMatch);
  const range: Range = {
    type: RangeType.Recurrence,
    from: lengthAtIndex[i] + indexInString,
    to: lengthAtIndex[i] + indexInString + recurrenceMatch.length,
    content: recurrenceMatch,
  };

  let recurrenceCount: number;
  if (eventStartLineRegexMatch[recurrence_recurrenceAmountMatchIndex]) {
    const recurrenceAmountString =
      eventStartLineRegexMatch[recurrence_recurrenceAmountMatchIndex].trim();
    if (recurrenceAmountString.toLowerCase() === "other") {
      recurrenceCount = 2;
    } else {
      recurrenceCount = parseInt(recurrenceAmountString);
    }
  } else {
    recurrenceCount = 1;
  }

  const units = [
    "years",
    "months",
    "weeks",
    "weekdays",
    "days",
    "hours",
    "minutes",
    "seconds",
    "milliseconds",
  ] as DurationUnit[];
  const recurrenceUnitIndex = [
    recurrence_recurrenceAmountYearsUnitMatchIndex,
    recurrence_recurrenceAmountMonthsUnitMatchIndex,
    recurrence_recurrenceAmountWeeksUnitMatchIndex,
    recurrence_recurrenceAmountWeekDayMatchIndex,
    recurrence_recurrenceAmountDaysUnitMatchIndex,
    recurrence_recurrenceAmountHoursUnitMatchIndex,
    recurrence_recurrenceAmountMinutesUnitMatchIndex,
    recurrence_recurrenceAmountSecondsUnitMatchIndex,
    recurrence_recurrenceAmountMillisecondsUnitMatchIndex,
  ].findIndex((regex) => !!eventStartLineRegexMatch[regex])!;

  const unit = units[recurrenceUnitIndex];
  const every = {
    [unit]: recurrenceCount,
  } as Duration;

  const til = getTil(line, i, lengthAtIndex, eventStartLineRegexMatch, context);

  if (eventStartLineRegexMatch[recurrence_repetitionsMatchIndex]) {
    if (eventStartLineRegexMatch[recurrence_repetitionsForAmountMatchIndex]) {
      const repetitionCount = parseInt(
        eventStartLineRegexMatch[
          recurrence_repetitionsForAmountAmountMatchIndex
        ].trim()
      );

      const units = [
        "years",
        "months",
        "weeks",
        "weekdays",
        "days",
        "hours",
        "minutes",
        "seconds",
        "milliseconds",
        "times",
      ] as (DurationUnit | "times")[];
      const repeitionUnitIndex = [
        recurrence_repetitionsForAmountYearsUnitMatchIndex,
        recurrence_repetitionsForAmountMonthsUnitMatchIndex,
        recurrence_repetitionsForAmountWeeksUnitMatchIndex,
        recurrence_repetitionsForAmountWeekDayMatchIndex,
        recurrence_repetitionsForAmountDaysUnitMatchIndex,
        recurrence_repetitionsForAmountHoursUnitMatchIndex,
        recurrence_repetitionsForAmountMinutesUnitMatchIndex,
        recurrence_repetitionsForAmountSecondsUnitMatchIndex,
        recurrence_repetitionsForAmountMillisecondsUnitMatchIndex,
        recurrence_repetitionsForAmountTimesMatchIndex,
      ].findIndex((regex) => eventStartLineRegexMatch[regex])!;
      const repetitionUnit = units[repeitionUnitIndex];
      return {
        recurrence: {
          every,
          for: {
            [repetitionUnit]: repetitionCount,
          },
          til: til?.toISO(),
        },
        range,
      };
    } else {
      const repetitionCount = parseInt(
        eventStartLineRegexMatch[
          recurrence_recurrenceAmountXNotationAmountMatchIndex
        ].trim()
      );
      return {
        recurrence: {
          every,
          for: {
            times: repetitionCount,
          },
          til: til?.toISO(),
        },
        range,
      };
    }
  }
  return { recurrence: { every, til: til?.toISO() }, range };
};
