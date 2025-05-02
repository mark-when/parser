import { DateRange, Event, toDateRange, toDateRangeIso } from "../Types.js";
import { DateTime, Duration } from "luxon";
import { Recurrence, toJsDates } from "../dateRange/checkRecurrence.js";
import * as RRule from "@markwhen/rrule";

export const expand = (
  dateRange: DateRange,
  recurrence: Recurrence,
  limit: number
): DateRange[] => {
  const instanceDuration = dateRange.toDateTime.diff(dateRange.fromDateTime);
  recurrence.dtstart = dateRange.fromDateTime.toISO();

  const rule = new RRule.RRule(toJsDates(recurrence));
  const expansion: DateTime[] = [];
  rule.all((d, i) => {
    if (i >= limit) {
      return false;
    }
    expansion.push(DateTime.fromJSDate(d));
    return true;
  });

  if (!expansion.length) {
    return [dateRange];
  }

  return expansion.map((dt) => ({
    fromDateTime: dt,
    toDateTime: dt.plus(instanceDuration),
  }));
};

export const expandEvent = (event: Event, limit: number): Event[] => {
  if (!event.recurrence || !limit) {
    return [event];
  }
  return expand(toDateRange(event.dateRangeIso), event.recurrence, limit).map(
    (dr) => ({
      ...event,
      dateRangeIso: toDateRangeIso(dr),
    })
  );
};
