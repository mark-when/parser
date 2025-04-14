import { DateTime } from "luxon";
import {
  edtf_recurrenceMatchIndex,
  recurrence_recurrenceMatchIndex,
} from "../regex.js";
import { Range, RangeType } from "../Types.js";
import { ParsingContext } from "../ParsingContext.js";
import { Caches } from "../Cache.js";
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
export type Recurrence = Partial<Options>;

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
  const from = lengthAtIndex[i] + indexInString;
  const to = lengthAtIndex[i] + indexInString + recurrenceMatch.length;
  const range: Range = {
    type: RangeType.Recurrence,
    from,
    to,
    content: recurrenceMatch,
  };

  try {
    const recurrence = RRule.parseText(recurrenceMatch);
    return { recurrence, range };
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

  const recurrence = RRule.parseText(recurrenceMatch);
  return { recurrence, range };
};
