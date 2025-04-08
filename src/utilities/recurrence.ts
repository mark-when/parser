import { DateRange, Event, toDateRange, toDateRangeIso } from "../Types.js";
import { DateTime, Duration } from "luxon";
import { Recurrence } from "../dateRange/checkRecurrence.js";

export const expand = (
  dateRange: DateRange,
  recurrence: Recurrence,
  limit: number
): DateRange[] => {
  const instanceDuration = dateRange.toDateTime.diff(dateRange.fromDateTime);
  const startTime = dateRange.fromDateTime;
  const every = Duration.fromObject(recurrence.every);
  const untilTimes = Math.min(recurrence.for?.times || limit, limit);

  let untilDate = recurrence.til ? DateTime.fromISO(recurrence.til) : undefined;
  if (
    !untilDate &&
    typeof recurrence.for !== "undefined" &&
    !recurrence.for.times
  ) {
    const untilDuration = Duration.fromObject(recurrence.for);
    untilDate = startTime.plus(untilDuration);
  }

  const expansion = [startTime];
  for (let i = 1; i < untilTimes; i++) {
    const previous = expansion[i - 1];
    const next = previous.plus(every);
    if (untilDate && +next >= +untilDate) {
      break;
    }
    expansion.push(next);
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
