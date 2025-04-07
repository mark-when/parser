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
  edtf_recurrence_untilDateMonthPart,
  edtf_recurrence_untilDateDayPart,
  edtf_recurrence_untilDateTimePartMatchIndex,
  edtf_recurrence_untilBeforeOrAfterMatchIndex,
  edtf_recurrence_untilRelativeMatchIndex,
  edtf_recurrence_untilNowMatchIndex,
  edtf_recurrence_untilDateTimeMeridiemHourMatchIndex,
  edtf_recurrence_untilDateTimeMeridiemMinuteMatchIndex,
  edtf_recurrence_untilDateTimeMeridiemMeridiemMatchIndex,
  edtf_recurrence_untilDateTime24HourHourMatchIndex,
  edtf_recurrence_untilDateTime24HourMinuteMatchIndex,
  edtf_recurrence_untilRelativeEventIdMatchIndex,
} from "../regex.js";
import { Range, RangeType, toDateRange } from "../Types.js";
import { ParsingContext } from "../ParsingContext.js";
import { Cache, Caches } from "../Cache.js";
import { getPriorEvent, getTimeFromRegExpMatch } from "./utils.js";

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
  til?: DateTime;
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

  const tilMatch = eventStartLineRegexMatch[edtf_recurrence_untilMatchIndex];
  let til: DateTime | undefined;
  if (tilMatch) {
    const datePart = eventStartLineRegexMatch[edtf_recurrence_untilDateIndex];
    const hasTime =
      !!eventStartLineRegexMatch[edtf_recurrence_untilDateTimePartMatchIndex];
    const relativeDate =
      eventStartLineRegexMatch[edtf_recurrence_untilRelativeMatchIndex];
    const now = eventStartLineRegexMatch[edtf_recurrence_untilNowMatchIndex];

    const indexOfDatePart = line.indexOf(datePart, line.indexOf(tilMatch));
    const dateRangeInText: Range = {
      type: RangeType.RecurrenceTilDate,
      from: lengthAtIndex[i] + indexOfDatePart,
      to: lengthAtIndex[i] + indexOfDatePart + datePart.length,
    };
    context.ranges.push(dateRangeInText);

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
    } else if (relativeDate) {
      const relativeToEventId =
        eventStartLineRegexMatch[
          edtf_recurrence_untilRelativeEventIdMatchIndex
        ];
      let relativeTo =
        relativeToEventId && context.ids[relativeToEventId]
          ? toDateRange(context.ids[relativeToEventId].dateRangeIso)
              .fromDateTime
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
    } else if (now) {
      til = context.zonedNow;
    } else {
      til = DateTime.fromISO(datePart);
    }

    if (!til || !til.isValid) {
      til = context.zonedNow;
    }
  }

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
          til,
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
          til,
        },
        range,
      };
    }
  }
  return { recurrence: { every, til }, range };
};

export const checkRecurrence = (
  eventStartLineRegexMatch: RegExpMatchArray,
  lengthAtIndex: number[],
  i: number
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
        },
        range,
      };
    }
  }
  return { recurrence: { every }, range };
};
