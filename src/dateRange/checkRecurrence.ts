import {
  recurrence_edtfRecurrenceAmountDaysUnitMatchIndex,
  recurrence_edtfRecurrenceAmountHoursUnitMatchIndex,
  recurrence_edtfRecurrenceAmountMatchIndex,
  recurrence_edtfRecurrenceAmountMillisecondsUnitMatchIndex,
  recurrence_edtfRecurrenceAmountMinutesUnitMatchIndex,
  recurrence_edtfRecurrenceAmountMonthsUnitMatchIndex,
  recurrence_edtfRecurrenceAmountSecondsUnitMatchIndex,
  recurrence_edtfRecurrenceAmountWeekDayMatchIndex,
  recurrence_edtfRecurrenceAmountWeeksUnitMatchIndex,
  recurrence_edtfRecurrenceAmountXNotationAmountMatchIndex,
  recurrence_edtfRecurrenceAmountYearsUnitMatchIndex,
  recurrence_edtfRecurrenceMatchIndex,
  recurrence_edtfRepetitionsForAmountAmountMatchIndex,
  recurrence_edtfRepetitionsForAmountDaysUnitMatchIndex,
  recurrence_edtfRepetitionsForAmountHoursUnitMatchIndex,
  recurrence_edtfRepetitionsForAmountMatchIndex,
  recurrence_edtfRepetitionsForAmountMillisecondsUnitMatchIndex,
  recurrence_edtfRepetitionsForAmountMinutesUnitMatchIndex,
  recurrence_edtfRepetitionsForAmountMonthsUnitMatchIndex,
  recurrence_edtfRepetitionsForAmountSecondsUnitMatchIndex,
  recurrence_edtfRepetitionsForAmountTimesMatchIndex,
  recurrence_edtfRepetitionsForAmountWeekDayMatchIndex,
  recurrence_edtfRepetitionsForAmountWeeksUnitMatchIndex,
  recurrence_edtfRepetitionsForAmountYearsUnitMatchIndex,
  recurrence_edtfRepetitionsMatchIndex,
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
} from "../regex";
import { Range, RangeType } from "../Types";

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
  eventStartLineRegexMatch: RegExpMatchArray,
  lengthAtIndex: number[],
  i: number
): RecurrenceInText | undefined => {
  const recurrenceMatch =
    eventStartLineRegexMatch[recurrence_edtfRecurrenceMatchIndex];

  if (!recurrenceMatch) {
    return;
  }

  const indexInString = eventStartLineRegexMatch[0].indexOf(recurrenceMatch);
  const range: Range = {
    type: RangeType.Recurrence,
    from: lengthAtIndex[i] + indexInString,
    to: lengthAtIndex[i] + indexInString + recurrenceMatch.length,
    lineFrom: { line: i, index: indexInString },
    lineTo: { line: i, index: indexInString + recurrenceMatch.length },
  };

  let recurrenceCount: number;
  const recurrenceAmountString =
    eventStartLineRegexMatch[recurrence_edtfRecurrenceAmountMatchIndex];
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
    recurrence_edtfRecurrenceAmountYearsUnitMatchIndex,
    recurrence_edtfRecurrenceAmountMonthsUnitMatchIndex,
    recurrence_edtfRecurrenceAmountWeeksUnitMatchIndex,
    recurrence_edtfRecurrenceAmountWeekDayMatchIndex,
    recurrence_edtfRecurrenceAmountDaysUnitMatchIndex,
    recurrence_edtfRecurrenceAmountHoursUnitMatchIndex,
    recurrence_edtfRecurrenceAmountMinutesUnitMatchIndex,
    recurrence_edtfRecurrenceAmountSecondsUnitMatchIndex,
    recurrence_edtfRecurrenceAmountMillisecondsUnitMatchIndex,
  ].findIndex((regex) => !!eventStartLineRegexMatch[regex])!;

  const unit = recurrenceDurationUnits[recurrenceUnitIndex];
  const every = {
    [unit]: recurrenceCount,
  } as Duration;

  if (eventStartLineRegexMatch[recurrence_edtfRepetitionsMatchIndex]) {
    if (
      eventStartLineRegexMatch[recurrence_edtfRepetitionsForAmountMatchIndex]
    ) {
      const repetitionCount = parseInt(
        eventStartLineRegexMatch[
          recurrence_edtfRepetitionsForAmountAmountMatchIndex
        ].trim()
      );

      const units = [...recurrenceDurationUnits, "times"] as (
        | DurationUnit
        | "times"
      )[];
      const repeitionUnitIndex = [
        recurrence_edtfRepetitionsForAmountYearsUnitMatchIndex,
        recurrence_edtfRepetitionsForAmountMonthsUnitMatchIndex,
        recurrence_edtfRepetitionsForAmountWeeksUnitMatchIndex,
        recurrence_edtfRepetitionsForAmountWeekDayMatchIndex,
        recurrence_edtfRepetitionsForAmountDaysUnitMatchIndex,
        recurrence_edtfRepetitionsForAmountHoursUnitMatchIndex,
        recurrence_edtfRepetitionsForAmountMinutesUnitMatchIndex,
        recurrence_edtfRepetitionsForAmountSecondsUnitMatchIndex,
        recurrence_edtfRepetitionsForAmountMillisecondsUnitMatchIndex,
        recurrence_edtfRepetitionsForAmountTimesMatchIndex,
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
          recurrence_edtfRecurrenceAmountXNotationAmountMatchIndex
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
    lineFrom: { line: i, index: indexInString },
    lineTo: { line: i, index: indexInString + recurrenceMatch.length },
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
