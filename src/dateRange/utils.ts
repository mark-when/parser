import { DateTime } from "luxon";
import { ParsingContext } from "../ParsingContext.js";
import {
  from_slashDateTimeMeridiemHourMatchIndex,
  from_slashDateTimeMeridiemMinuteMatchIndex,
  from_slashDateTimeMeridiemMeridiemMatchIndex,
  from_slashDateTime24HourHourMatchIndex,
  from_slashDateTime24HourMinuteMatchIndex,
  to_slashDateTimeMeridiemHourMatchIndex,
  to_slashDateTimeMeridiemMinuteMatchIndex,
  to_slashDateTimeMeridiemMeridiemMatchIndex,
  to_slashDateTime24HourHourMatchIndex,
  to_slashDateTime24HourMinuteMatchIndex,
  from_casualMonthTimeMeridiemHourMatchIndex,
  from_casualMonthTimeMeridiemMinuteMatchIndex,
  from_casualMonthTimeMeridiemMeridiemMatchIndex,
  from_casualMonthTime24HourHourMatchIndex,
  from_casualMonthTime24HourMinuteMatchIndex,
  to_casualMonthTimeMeridiemHourMatchIndex,
  to_casualMonthTimeMeridiemMinuteMatchIndex,
  to_casualMonthTimeMeridiemMeridiemMatchIndex,
  to_casualMonthTime24HourHourMatchIndex,
  to_casualMonthTime24HourMinuteMatchIndex,
  from_monthFirstCasualMonthMonthFullMatchIndex,
  from_monthFirstCasualMonthDayMatchIndex,
  from_casualMonthAndDayYearMatchIndex,
  from_casualMonthTimeMatchIndex,
  from_monthFirstCasualMonthMonthAbbrMatchIndex,
  from_dayFirstCasualMonthDayMatchIndex,
  from_dayFirstCasualMonthMonthFullMatchIndex,
  from_dayFirstCasualMonthMonthAbbrMatchIndex,
  from_casualMonthYearMatchIndex,
  from_casualMonthMonthFullMatchIndex,
  from_casualMonthMonthAbbrMatchIndex,
  to_monthFirstCasualMonthMonthFullMatchIndex,
  to_monthFirstCasualMonthDayMatchIndex,
  to_casualMonthAndDayYearMatchIndex,
  to_casualMonthTimeMatchIndex,
  to_monthFirstCasualMonthMonthAbbrMatchIndex,
  to_dayFirstCasualMonthDayMatchIndex,
  to_dayFirstCasualMonthMonthFullMatchIndex,
  to_dayFirstCasualMonthMonthAbbrMatchIndex,
  to_casualMonthYearMatchIndex,
  to_casualMonthMonthFullMatchIndex,
  to_casualMonthMonthAbbrMatchIndex,
  GROUP_START_REGEX,
  TAG_REGEX,
} from "../regex.js";
import {
  GranularDateTime,
  Event,
  Range,
  DATE_TIME_FORMAT_MONTH_YEAR,
  DATE_TIME_FORMAT_YEAR,
  toDateRange,
  DateTimeIso,
  DateTimeGranularity,
  EventGroup,
} from "../Types.js";
import { Caches } from "../Cache.js";

export function getTimeFromRegExpMatch(
  eventStartMatches: RegExpMatchArray,
  meridiemHourIndex: number,
  meridiemMinuteIndex: number,
  meridiemIndex: number,
  time24HourHourIndex: number,
  time24HourMinuteIndex: number
): GranularDateTime {
  const timeMeridiemHour = eventStartMatches[meridiemHourIndex];
  const timeMeridiemMinute = eventStartMatches[meridiemMinuteIndex] || ":00";
  let timeMeridiem = eventStartMatches[meridiemIndex];
  if (!timeMeridiem) {
    // We're going to do our best guess here
    const int = parseInt(timeMeridiemHour);
    if (isNaN(int)) {
      timeMeridiem = "am";
    }
    if (int < 9 || int === 12) {
      timeMeridiem = "pm";
    } else {
      timeMeridiem = "am";
    }
  }

  if (timeMeridiemHour) {
    return {
      dateTimeIso: DateTime.fromFormat(
        `${timeMeridiemHour}${timeMeridiemMinute}${timeMeridiem}`,
        "h:mma"
      ).toISO(),
      granularity: timeMeridiemMinute === ":00" ? "hour" : "minute",
    };
  }

  const time24HourHour = eventStartMatches[time24HourHourIndex];
  const time24HourMinute = eventStartMatches[time24HourMinuteIndex] || ":00";
  return {
    dateTimeIso: DateTime.fromFormat(
      `${time24HourHour}${time24HourMinute}`,
      `${
        time24HourHour.length === 2 && time24HourHour[0] === "0" ? "HH" : "H"
      }:mm`
    ).toISO(),
    granularity: time24HourMinute === ":00" ? "hour" : "minute",
  };
}

export function getTimeFromSlashDateFrom(eventStartMatches: RegExpMatchArray) {
  const meridiemHourIndex = from_slashDateTimeMeridiemHourMatchIndex;
  const meridiemMinuteIndex = from_slashDateTimeMeridiemMinuteMatchIndex;
  const meridiemIndex = from_slashDateTimeMeridiemMeridiemMatchIndex;
  const time24HourHourIndex = from_slashDateTime24HourHourMatchIndex;
  const time24HourMinuteIndex = from_slashDateTime24HourMinuteMatchIndex;
  return getTimeFromRegExpMatch(
    eventStartMatches,
    meridiemHourIndex,
    meridiemMinuteIndex,
    meridiemIndex,
    time24HourHourIndex,
    time24HourMinuteIndex
  );
}

export function getTimeFromSlashDateTo(eventStartMatches: RegExpMatchArray) {
  const meridiemHourIndex = to_slashDateTimeMeridiemHourMatchIndex;
  const meridiemMinuteIndex = to_slashDateTimeMeridiemMinuteMatchIndex;
  const meridiemIndex = to_slashDateTimeMeridiemMeridiemMatchIndex;
  const time24HourHourIndex = to_slashDateTime24HourHourMatchIndex;
  const time24HourMinuteIndex = to_slashDateTime24HourMinuteMatchIndex;
  return getTimeFromRegExpMatch(
    eventStartMatches,
    meridiemHourIndex,
    meridiemMinuteIndex,
    meridiemIndex,
    time24HourHourIndex,
    time24HourMinuteIndex
  );
}

export function getTimeFromCasualMonthFrom(
  eventStartMatches: RegExpMatchArray
): GranularDateTime {
  const meridiemHourIndex = from_casualMonthTimeMeridiemHourMatchIndex;
  const meridiemMinuteIndex = from_casualMonthTimeMeridiemMinuteMatchIndex;
  const meridiemIndex = from_casualMonthTimeMeridiemMeridiemMatchIndex;
  const time24HourHourIndex = from_casualMonthTime24HourHourMatchIndex;
  const time24HourMinuteIndex = from_casualMonthTime24HourMinuteMatchIndex;
  return getTimeFromRegExpMatch(
    eventStartMatches,
    meridiemHourIndex,
    meridiemMinuteIndex,
    meridiemIndex,
    time24HourHourIndex,
    time24HourMinuteIndex
  );
}

export function getTimeFromCasualMonthTo(eventStartMatches: RegExpMatchArray) {
  const meridiemHourIndex = to_casualMonthTimeMeridiemHourMatchIndex;
  const meridiemMinuteIndex = to_casualMonthTimeMeridiemMinuteMatchIndex;
  const meridiemIndex = to_casualMonthTimeMeridiemMeridiemMatchIndex;
  const time24HourHourIndex = to_casualMonthTime24HourHourMatchIndex;
  const time24HourMinuteIndex = to_casualMonthTime24HourMinuteMatchIndex;
  return getTimeFromRegExpMatch(
    eventStartMatches,
    meridiemHourIndex,
    meridiemMinuteIndex,
    meridiemIndex,
    time24HourHourIndex,
    time24HourMinuteIndex
  );
}

export function fromCasualDateFrom(
  eventStartMatches: RegExpMatchArray,
  context: ParsingContext
): GranularDateTime | undefined {
  let month = eventStartMatches[from_monthFirstCasualMonthMonthFullMatchIndex];
  let day = eventStartMatches[from_monthFirstCasualMonthDayMatchIndex];
  let year =
    eventStartMatches[from_casualMonthAndDayYearMatchIndex] ||
    `${context.zonedNow.year}`;

  let timeMatch =
    eventStartMatches[from_casualMonthTimeMatchIndex] &&
    getTimeFromCasualMonthFrom(eventStartMatches);

  let date =
    month &&
    day &&
    parseAsCasualDayFullMonth(`${year} ${month} ${parseInt(day)}`, context);

  month = eventStartMatches[from_monthFirstCasualMonthMonthAbbrMatchIndex];
  date =
    date ||
    (month &&
      day &&
      parseAsCasualDayAbbrMonth(`${year} ${month} ${parseInt(day)}`, context));

  day = eventStartMatches[from_dayFirstCasualMonthDayMatchIndex];
  month = eventStartMatches[from_dayFirstCasualMonthMonthFullMatchIndex];
  date =
    date ||
    (month &&
      day &&
      parseAsCasualDayFullMonth(`${year} ${month} ${parseInt(day)}`, context));

  month = eventStartMatches[from_dayFirstCasualMonthMonthAbbrMatchIndex];
  date =
    date ||
    (month &&
      day &&
      parseAsCasualDayAbbrMonth(`${year} ${month} ${parseInt(day)}`, context));

  if (date) {
    if (timeMatch) {
      const dt = DateTime.fromISO(date.dateTimeIso, {
        setZone: true,
        zone: context.timezone,
      });
      const timeMatchIso = DateTime.fromISO(timeMatch.dateTimeIso, {
        setZone: true,
        zone: context.timezone,
      });
      date.dateTimeIso = dt
        .set({
          hour: timeMatchIso.hour,
          minute: timeMatchIso.minute,
        })
        .toISO();
      date.granularity = timeMatch.granularity;
    }
    return date;
  }

  year =
    eventStartMatches[from_casualMonthYearMatchIndex] ||
    `${context.zonedNow.year}`;
  month = eventStartMatches[from_casualMonthMonthFullMatchIndex];
  if (month) {
    return {
      dateTimeIso: DateTime.fromFormat(`${year} ${month}`, "y MMMM", {
        setZone: true,
        zone: context.timezone,
      }).toISO(),
      granularity: "month",
    };
  }
  month = eventStartMatches[from_casualMonthMonthAbbrMatchIndex];
  if (month) {
    return {
      dateTimeIso: DateTime.fromFormat(`${year} ${month}`, "y MMM", {
        setZone: true,
        zone: context.timezone,
      }).toISO(),
      granularity: "month",
    };
  }
}

export function fromCasualDateTo(
  eventStartMatches: RegExpMatchArray,
  context: ParsingContext
): GranularDateTime | undefined {
  let month = eventStartMatches[to_monthFirstCasualMonthMonthFullMatchIndex];
  let day = eventStartMatches[to_monthFirstCasualMonthDayMatchIndex];
  let year =
    eventStartMatches[to_casualMonthAndDayYearMatchIndex] ||
    `${context.zonedNow.year}`;

  let timeMatch =
    eventStartMatches[to_casualMonthTimeMatchIndex] &&
    getTimeFromCasualMonthTo(eventStartMatches);

  let date =
    month &&
    day &&
    parseAsCasualDayFullMonth(`${year} ${month} ${parseInt(day)}`, context);

  month = eventStartMatches[to_monthFirstCasualMonthMonthAbbrMatchIndex];
  date =
    date ||
    (month &&
      day &&
      parseAsCasualDayAbbrMonth(`${year} ${month} ${parseInt(day)}`, context));

  day = eventStartMatches[to_dayFirstCasualMonthDayMatchIndex];
  month = eventStartMatches[to_dayFirstCasualMonthMonthFullMatchIndex];
  date =
    date ||
    (month &&
      day &&
      parseAsCasualDayFullMonth(`${year} ${month} ${parseInt(day)}`, context));

  month = eventStartMatches[to_dayFirstCasualMonthMonthAbbrMatchIndex];
  date =
    date ||
    (month &&
      day &&
      parseAsCasualDayAbbrMonth(`${year} ${month} ${parseInt(day)}`, context));

  if (date) {
    if (timeMatch) {
      if (timeMatch) {
        const dt = DateTime.fromISO(date.dateTimeIso, {
          setZone: true,
          zone: context.timezone,
        });
        const timeMatchIso = DateTime.fromISO(timeMatch.dateTimeIso, {
          setZone: true,
          zone: context.timezone,
        });
        date.dateTimeIso = dt
          .set({
            hour: timeMatchIso.hour,
            minute: timeMatchIso.minute,
          })
          .toISO();
        date.granularity = timeMatch.granularity;
      }
    }
    return date;
  }

  year =
    eventStartMatches[to_casualMonthYearMatchIndex] || `${context.zonedNow.year}`;
  month = eventStartMatches[to_casualMonthMonthFullMatchIndex];
  if (month) {
    return {
      dateTimeIso: DateTime.fromFormat(`${year} ${month}`, "y MMMM", {
        setZone: true,
        zone: context.timezone,
      }).toISO(),
      granularity: "month",
    };
  }
  month = eventStartMatches[to_casualMonthMonthAbbrMatchIndex];
  if (month) {
    return {
      dateTimeIso: DateTime.fromFormat(`${year} ${month}`, "y MMM", {
        setZone: true,
        zone: context.timezone,
      }).toISO(),
      granularity: "month",
    };
  }
}

export function parseAsCasualDayFullMonth(
  s: string,
  context: ParsingContext
): GranularDateTime {
  return {
    dateTimeIso: DateTime.fromFormat(s, "y MMMM d", {
      setZone: true,
      zone: context.timezone,
    }).toISO(),
    granularity: "day",
  };
}

export function parseAsCasualDayAbbrMonth(
  s: string,
  context: ParsingContext
): GranularDateTime {
  return {
    dateTimeIso: DateTime.fromFormat(s, "y MMM d", {
      setZone: true,
      zone: context.timezone,
    }).toISO(),
    granularity: "day",
  };
}

export function parseGroupFromStartTag(
  s: string,
  regexMatch: RegExpMatchArray,
  range: Range
): EventGroup {
  const group: EventGroup = new EventGroup();
  group.tags = [];
  group.style = "group";
  group.textRanges = { whole: range };

  s = s
    .replace(GROUP_START_REGEX, (match, startToken, groupOrSection) => {
      // Start expanded if this start tag is not indented
      group.startExpanded = !startToken.length;
      group.style = groupOrSection as "group" | "section";
      return "";
    })
    .replace(TAG_REGEX, (match, tag) => {
      if (!group.tags!.includes(tag)) {
        group.tags!.push(tag);
      }
      return "";
    });

  group.title = s.trim();
  return group;
}

export function getPriorEvent(context: ParsingContext): Event | undefined {
  return context.tail;
}

export function getPriorEventToDateTime(
  context: ParsingContext
): DateTime | undefined {
  const priorEvent = getPriorEvent(context);
  if (!priorEvent) {
    return;
  }
  return toDateRange(priorEvent.dateRangeIso).toDateTime;
}

export function getPriorEventFromDateTime(context: ParsingContext) {
  const priorEvent = getPriorEvent(context);
  if (!priorEvent) {
    return;
  }
  return toDateRange(priorEvent.dateRangeIso).fromDateTime;
}

export function parseSlashDate(
  s: string,
  fullFormat: string,
  context: ParsingContext,
  cache?: Caches
): GranularDateTime | undefined {
  const cacheKey = JSON.stringify({ s, fullFormat });
  const cached = cache?.zone(context.timezone).slashDate.get(cacheKey);
  if (cached) {
    return cached;
  }

  const formatsAndGranularities = [
    [fullFormat, "day"],
    [DATE_TIME_FORMAT_MONTH_YEAR, "month"],
    [DATE_TIME_FORMAT_YEAR, "year"],
  ] as [string, DateTimeGranularity][];

  for (const f of formatsAndGranularities) {
    let dateTime = DateTime.fromFormat(s, f[0], {
      setZone: true,
      zone: context.timezone,
    });
    if (dateTime.isValid) {
      const gdt = {
        dateTimeIso: dateTime.toISO(),
        granularity: f[1],
      };
      cache?.zone(context.timezone).slashDate.set(cacheKey, gdt);
      return gdt;
    }
  }
}

export function roundDateUp(
  granularDateTime: GranularDateTime,
  context: ParsingContext,
  cache?: Caches
): DateTimeIso {
  const cacheKey = JSON.stringify(granularDateTime);
  const cached = cache?.zone(context.timezone).roundDateUp.get(cacheKey);
  if (cached) {
    return cached;
  }

  const cacheAndReturn = (s: DateTimeIso) => {
    cache?.zone(context.timezone).roundDateUp.set(cacheKey, s);
    return s;
  };

  const dt = DateTime.fromISO(granularDateTime.dateTimeIso, {
    setZone: true,
    zone: context.timezone,
  });
  if (!dt.isValid) {
    return cacheAndReturn(granularDateTime.dateTimeIso);
  }
  if (
    ["instant", "hour", "minute", "second"].includes(
      granularDateTime.granularity
    )
  ) {
    return cacheAndReturn(granularDateTime.dateTimeIso);
  }
  return cacheAndReturn(
    dt
      .plus({
        [granularDateTime.granularity]: 1,
      })
      .toISO()
  );
}

export function getYearNotationToDatetime(
  year: string | number,
  yearNotation: string | undefined,
  context: ParsingContext
): DateTime | undefined {
  if (typeof year === "string") {
    year = parseInt(year);
  }

  if (yearNotation && (yearNotation === "BCE" || yearNotation === "BC")) {
    /**
     * It's a negative date and we need to remove 1 year to get the correct year
     * The reason is that the year 0 does not exist in the Gregorian calendar
     **/
    year = -(year - 1);
  }
  return DateTime.fromObject({ year }, { zone: context.timezone });
}
