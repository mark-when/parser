import { DateTime } from "luxon";
import { ParsingContext } from "../ParsingContext.js";
import { Caches } from "../Cache.js";
import {
  BCEDatePartMatchIndex,
  fromYear_BCEDateIndex,
  toYear_BCEDateIndex,
  BCEEventTextMatchIndex,
  BCE_START_REGEX,
  fromYearNotation_BCEDateIndex,
  toYearNotation_BCEDateIndex,
} from "../regex.js";
import {
  DateRangePart,
  DateTimeGranularity,
  RangeType,
  Range,
} from "../Types.js";
import { roundDateUp, getYearNotationToDatetime } from "./utils.js";

export function getDateRangeFromBCEDateRegexMatch(
  line: string,
  i: number,
  lengthAtIndex: number[],
  context: ParsingContext,
  cache?: Caches
): DateRangePart | undefined {
  // Check if its this type of event ---------------------------------------------------------------------------------
  const eventStartLineRegexMatch = line.match(BCE_START_REGEX);
  if (!eventStartLineRegexMatch) {
    return;
  }
  // It's a match we want to proceed ---------------------------------------------------------------------------------
  const datePart = eventStartLineRegexMatch[BCEDatePartMatchIndex];

  // Extract date FROM parts -----------------------------------------------------------------------------------------
  const BCEFromYear = eventStartLineRegexMatch[fromYear_BCEDateIndex];
  const BCEFromYearNotation =
    eventStartLineRegexMatch[fromYearNotation_BCEDateIndex] ||
    eventStartLineRegexMatch[toYearNotation_BCEDateIndex];
  // TODO: implement support of month and day.

  // Extract date TO parts -------------------------------------------------------------------------------------------
  const BCEToYear = eventStartLineRegexMatch[toYear_BCEDateIndex];
  const BCEToYearNotation =
    eventStartLineRegexMatch[toYearNotation_BCEDateIndex];
  // TODO: implement support of month and day.

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
  const cached = cache?.zone(context.timezone).ranges.get(datePart);
  if (cached) {
    const colon = colonRange(RangeType.DateRangeColon);
    context.ranges.push(colon);
    return new DateRangePart({
      from: DateTime.fromISO(cached.fromDateTimeIso, { setZone: true }),
      to: DateTime.fromISO(cached.toDateTimeIso, { setZone: true }),
      originalString: datePart,
      dateRangeInText,
      eventText: eventStartLineRegexMatch[BCEEventTextMatchIndex],
      definition: {
        ...dateRangeInText,
        type: RangeType.EventDefinition,
        to: colon.to,
      },
    });
  }

  let fromDateTime: DateTime | undefined;
  let endDateTime: DateTime | undefined;
  let granularity: DateTimeGranularity = "year";
  let canCacheRange = true;

  if (BCEFromYear) {
    fromDateTime = getYearNotationToDatetime(
      BCEFromYear,
      BCEFromYearNotation,
      context
    );
  } else {
    // Not supported
    return;
  }

  if (!fromDateTime || !fromDateTime?.isValid) {
    fromDateTime = context.zonedNow;
    granularity = "instant";
  }

  if (!endDateTime) {
    if (BCEToYear) {
      endDateTime = getYearNotationToDatetime(
        BCEToYear,
        BCEToYearNotation,
        context
      );
    }
  }

  if (!endDateTime || !endDateTime.isValid) {
    endDateTime = DateTime.fromISO(
      roundDateUp(
        {
          dateTimeIso: fromDateTime.toISO(),
          granularity,
        },
        context,
        cache
      ),
      { setZone: true, zone: context.timezone }
    );
  }

  const colon = colonRange(RangeType.DateRangeColon);
  context.ranges.push(colon);
  const dateRange = new DateRangePart({
    from: fromDateTime,
    to: endDateTime,
    originalString: datePart,
    dateRangeInText,
    eventText: eventStartLineRegexMatch[BCEEventTextMatchIndex],
    definition: {
      ...dateRangeInText,
      type: RangeType.EventDefinition,
      to: colon.to,
    },
  });

  if (canCacheRange) {
    cache?.zone(context.timezone).ranges.set(datePart, {
      fromDateTimeIso: fromDateTime.toISO(),
      toDateTimeIso: endDateTime.toISO(),
    });
  }
  return dateRange;
}
