import { DateTime } from "luxon";
import {
  edtf_recurrenceMatchIndex,
  recurrence_recurrenceMatchIndex,
} from "../regex.js";
import { Range, RangeType } from "../Types.js";
import { ParsingContext } from "../ParsingContext.js";
import { Options, RRule } from "@markwhen/rrule";

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
export type Recurrence = Omit<Partial<Options>, "until" | "dtstart"> & {
  until?: string;
  dtstart?: string;
};

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

function makeRecurrenceSerializable(recurrence: Partial<Options>): Recurrence {
  const until = recurrence.until
    ? DateTime.fromJSDate(recurrence.until).toISO()
    : undefined;
  const dtstart = recurrence.dtstart
    ? DateTime.fromJSDate(recurrence.dtstart).toISO()
    : undefined;
  return { ...recurrence, until, dtstart };
}

export function toJsDates(recurrence: Recurrence): Partial<Options> {
  const until = recurrence.until
    ? DateTime.fromISO(recurrence.until).toJSDate()
    : undefined;
  const dtstart = recurrence.dtstart
    ? DateTime.fromISO(recurrence.dtstart).toJSDate()
    : undefined;
  return {
    ...recurrence,
    until,
    dtstart,
  };
}

export const checkEdtfRecurrence = (
  line: string,
  i: number,
  lengthAtIndex: number[],
  eventStartLineRegexMatch: RegExpMatchArray,
  context: ParsingContext
): RecurrenceInText | undefined => {
  const recurrenceMatch = eventStartLineRegexMatch[edtf_recurrenceMatchIndex];

  if (!recurrenceMatch) {
    return;
  }
  const recurrenceMatchTrimmed = recurrenceMatch.trim();
  const indexInString = eventStartLineRegexMatch[0].indexOf(
    recurrenceMatchTrimmed
  );
  const from = lengthAtIndex[i] + indexInString;
  const to = lengthAtIndex[i] + indexInString + recurrenceMatchTrimmed.length;
  const range: Range = {
    type: RangeType.Recurrence,
    from,
    to,
    content: recurrenceMatch,
  };

  try {
    const recurrence = RRule.parseText(recurrenceMatch);
    return { recurrence: makeRecurrenceSerializable(recurrence), range };
  } catch (e) {
    context.parseMessages.push({
      type: "error",
      message: "Cannot parse recurrence",
      pos: [from, to],
    });
    return;
  }
};

export const checkRecurrence = (
  line: string,
  i: number,
  lengthAtIndex: number[],
  eventStartLineRegexMatch: RegExpMatchArray,
  context: ParsingContext
): RecurrenceInText | undefined => {
  const recurrenceMatch =
    eventStartLineRegexMatch[recurrence_recurrenceMatchIndex];
  if (!recurrenceMatch) {
    return;
  }

  const recurrenceMatchTrimmed = recurrenceMatch.trim();
  const indexInString = eventStartLineRegexMatch[0].indexOf(
    recurrenceMatchTrimmed
  );
  const from = lengthAtIndex[i] + indexInString;
  const to = lengthAtIndex[i] + indexInString + recurrenceMatchTrimmed.length;
  const range: Range = {
    type: RangeType.Recurrence,
    from,
    to,
    content: recurrenceMatch,
  };

  try {
    const recurrence = RRule.parseText(recurrenceMatch);
    return { recurrence: makeRecurrenceSerializable(recurrence), range };
  } catch (e) {
    context.parseMessages.push({
      type: "error",
      message: "Cannot parse recurrence",
      pos: [from, to],
    });
    return;
  }
};
