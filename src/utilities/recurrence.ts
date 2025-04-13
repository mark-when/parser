import { DateRange, Event, toDateRange, toDateRangeIso } from "../Types.js";
import { DateTime, Duration } from "luxon";
import { Recurrence } from "../dateRange/checkRecurrence.js";
import { RRule } from "@markwhen/rrule";

export const expand = (
  dateRange: DateRange,
  recurrence: Recurrence,
  limit: number
): DateRange[] => {
  const instanceDuration = dateRange.toDateTime.diff(dateRange.fromDateTime);
  recurrence.dtstart = dateRange.fromDateTime.toJSDate();

  const rule = new RRule(recurrence);
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
