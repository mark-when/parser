import { DateTime, Duration } from "luxon";
import { COLORS, hexToRgb, HUMAN_COLORS } from "./ColorUtils";
import { Sort, EventSubGroup } from "./Sort";
import {
  Timeline,
  DateTimeGranularity,
  Event,
  EventDescription,
  IdedEvents,
  RelativeDate,
  Tags,
  Range,
  DateRangePart,
  Timelines,
  emptyTimeline,
  TAG_REGEX,
  GranularDateTime,
  AMERICAN_DATE_FORMAT,
  EUROPEAN_DATE_FORMAT,
} from "./Types";
import {
  COMMENT_REGEX,
  TAG_COLOR_REGEX,
  DATE_FORMAT_REGEX,
  TITLE_REGEX,
  DESCRIPTION_REGEX,
  GROUP_START_REGEX,
  GROUP_END_REGEX,
  PAGE_BREAK_REGEX,
  EVENT_START_REGEX,
  datePartMatchIndex,
  from_matchIndex,
  to_matchIndex,
  from_relativeEventIdMatchIndex,
  to_relativeEventIdMatchIndex,
  from_monthFirstCasualMonthMonthFullMatchIndex,
  from_monthFirstCasualMonthDayMatchIndex,
  from_casualMonthYearMatchIndex,
  from_casualMonthAndDayYearMatchIndex,
  from_monthFirstCasualMonthMonthAbbrMatchIndex,
  from_dayFirstCasualMonthDayMatchIndex,
  from_dayFirstCasualMonthMonthFullMatchIndex,
  from_dayFirstCasualMonthMonthAbbrMatchIndex,
  from_casualMonthMonthFullMatchIndex,
  from_casualMonthMonthAbbrMatchIndex,
  to_monthFirstCasualMonthMonthFullMatchIndex,
  to_casualMonthAndDayYearMatchIndex,
  to_monthFirstCasualMonthDayMatchIndex,
  to_dayFirstCasualMonthMonthFullMatchIndex,
  to_dayFirstCasualMonthDayMatchIndex,
  to_monthFirstCasualMonthMonthAbbrMatchIndex,
  to_casualMonthMonthAbbrMatchIndex,
  to_casualMonthMonthFullMatchIndex,
  to_casualMonthYearMatchIndex,
  to_dayFirstCasualMonthMonthAbbrMatchIndex,
  from_casualMonthTimeMatchIndex,
  from_casualMonthTime24HourHourMatchIndex,
  from_casualMonthTimeMeridiemHourMatchIndex,
  from_casualMonthTimeMeridiemMeridiemMatchIndex,
  to_casualMonthTimeMeridiemHourMatchIndex,
  to_casualMonthTimeMeridiemMeridiemMatchIndex,
  from_casualMonthTime24HourMinuteMatchIndex,
  to_casualMonthTime24HourHourMatchIndex,
  to_casualMonthTime24HourMinuteMatchIndex,
  from_casualMonthTimeMeridiemMinuteMatchIndex,
  to_casualMonthTimeMeridiemMinuteMatchIndex,
  to_casualMonthTimeMatchIndex,
  from_slashDateFullMatchIndex,
  from_slashDateTimeMatchIndex,
  from_slashDateTime24HourHourMatchIndex,
  from_slashDateTime24HourMinuteMatchIndex,
  from_slashDateTimeMeridiemHourMatchIndex,
  from_slashDateTimeMeridiemMeridiemMatchIndex,
  from_slashDateTimeMeridiemMinuteMatchIndex,
  to_slashDateTime24HourHourMatchIndex,
  to_slashDateTime24HourMinuteMatchIndex,
  to_slashDateTimeMeridiemHourMatchIndex,
  to_slashDateTimeMeridiemMeridiemMatchIndex,
  to_slashDateTimeMeridiemMinuteMatchIndex,
  to_slashDateFullMatchIndex,
  to_slashDateTimeMatchIndex,
  from_timeOnlyMatchIndex,
  to_timeOnlyMatchIndex,
  from_timeOnly24HourHourMatchIndex,
  from_timeOnly24HourMinuteMatchIndex,
  from_timeOnlyMeridiemHourMatchIndex,
  from_timeOnlyMeridiemMeridiemMatchIndex,
  from_timeOnlyMeridiemMinuteMatchIndex,
  to_timeOnlyMeridiemHourMatchIndex,
  to_timeOnly24HourHourMatchIndex,
  to_timeOnly24HourMinuteMatchIndex,
  to_timeOnlyMeridiemMeridiemMatchIndex,
  to_timeOnlyMeridiemMinuteMatchIndex,
  from_nowMatchIndex,
  to_nowMatchIndex,
  EDTF_START_REGEX,
  from_edtfNowMatchIndex,
  to_edtfNowMatchIndex,
  to_edtfDateIndex,
  from_edtfDateIndex,
  from_edtfDateMonthPart,
  from_edtfDateDayPart,
  to_edtfDateDayPart,
  to_edtfDateMonthPart,
  to_edtfIndex,
  from_relativeMatchIndex,
  to_relativeMatchIndex,
  from_edtfRelativeMatchIndex,
  to_edtfRelativeMatchIndex,
  to_edtfRelativeEventIdMatchIndex,
  edtfDatePartMatchIndex,
  VIEWERS_REGEX,
  from_edtfRelativeEventIdMatchIndex,
  from_edtfBeforeOrAfterMatchIndex,
  from_beforeOrAfterMatchIndex,
  to_edtfBeforeOrAfterMatchIndex,
  to_beforeOrAfterMatchIndex,
} from "./regex";

export const sorts: Sort[] = ["none", "down", "up"];

export interface Foldable {
  endIndex: number;
  type: "comment" | "section";
  startLine: number;
  startIndex?: number;
  foldStartIndex?: number;
}

export function parse(timelineString?: string): Timelines {
  if (!timelineString) {
    return { timelines: [emptyTimeline()] };
  }

  const lines = timelineString.split("\n");
  let lengthAtIndex: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (i === 0) {
      lengthAtIndex.push(0);
    }
    lengthAtIndex.push(
      1 + lines[i].length + lengthAtIndex[lengthAtIndex.length - 1] || 0
    );
  }
  const timelines = [];
  let index = 0;
  do {
    const timeline = parseTimeline(lines, lengthAtIndex, index);
    index = timeline.metadata.endLineIndex + 1;
    timelines.push(timeline);
  } while (index < lines.length);

  return { timelines: timelines };
}

class ParsingContext {
  events: (Event | EventSubGroup)[];
  tags: Tags;
  ids: IdedEvents;
  title: string | undefined;
  description: string | undefined;
  paletteIndex: number;
  dateFormat: typeof AMERICAN_DATE_FORMAT | typeof EUROPEAN_DATE_FORMAT;
  earliest: DateTime | undefined;
  latest: DateTime | undefined;
  maxDuration: Duration | undefined;
  eventSubgroup: EventSubGroup | undefined;
  foldables: {
    [F in number | string]: Foldable;
  };
  ranges: Range[];
  preferredInterpolationFormat: string | undefined;
  viewers: string[];

  constructor() {
    this.events = [];
    this.tags = {};
    this.ids = {};
    this.title = undefined;
    this.description = undefined;
    this.paletteIndex = 0;
    this.dateFormat = AMERICAN_DATE_FORMAT;
    this.earliest = undefined;
    this.latest = undefined;
    this.maxDuration = undefined;
    this.eventSubgroup = undefined;
    this.foldables = {};
    this.ranges = [];
    this.viewers = [];
  }

  currentFoldableSection() {
    return this.foldables["section"];
  }

  currentFoldableComment() {
    return this.foldables["comment"];
  }

  startFoldable(f: Foldable) {
    this.foldables[f.type] = f;
  }

  finishFoldableSection(line: number, endIndex: number) {
    const currentFoldableSection = this.currentFoldableSection();
    if (currentFoldableSection) {
      if (currentFoldableSection.startLine < line - 1) {
        this.foldables[currentFoldableSection.startIndex!] = {
          ...currentFoldableSection,
          endIndex,
        };
      }
      delete this.foldables["section"];
    }
  }

  finishFoldableComment(lineNumber: number) {
    const commentFoldable = this.currentFoldableComment();
    if (commentFoldable) {
      if (commentFoldable.startLine < lineNumber - 1) {
        // We had had a foldable comment section that we can close off, since this line
        // is not a comment.
        this.foldables[commentFoldable.startIndex!] = {
          ...commentFoldable,
        };
      }
      delete this.foldables["comment"];
    }
  }

  toTimeline(
    lengthAtIndex: number[],
    startLineIndex: number,
    endLineIndex: number,
    endStringIndex: number
  ): Timeline {
    const now = DateTime.now();
    return {
      events: this.events,
      tags: this.tags,
      ids: this.ids,
      ranges: this.ranges,
      foldables: this.foldables,
      metadata: {
        earliestTime: this.earliest || now.minus({ years: 5 }),
        latestTime: this.latest || now.plus({ years: 5 }),
        maxDuration: this.maxDuration || now.diff(now.minus({ years: 1 })),
        dateFormat: this.dateFormat,
        startLineIndex,
        startStringIndex: lengthAtIndex[startLineIndex],
        endLineIndex,
        preferredInterpolationFormat: this.preferredInterpolationFormat,

        // minus one to make sure the newline character is always there
        endStringIndex,
        ...(this.title ? { title: this.title } : {}),
        ...(this.description ? { description: this.description } : {}),
        view: this.viewers ? this.viewers : [],
      },
    };
  }
}

function checkComments(
  line: string,
  i: number,
  lengthAtIndex: number[],
  context: ParsingContext
): boolean {
  if (line.match(COMMENT_REGEX)) {
    const from = lengthAtIndex[i];
    const to = from + line.length;
    context.ranges.push({
      type: "comment",
      from,
      to,
    });

    const currentFoldableComment = context.currentFoldableComment();
    if (currentFoldableComment) {
      currentFoldableComment.endIndex = to;
    } else {
      const indexOfSlashes = line.indexOf("//");
      context.startFoldable({
        startIndex: from,
        startLine: i,
        endIndex: to,
        type: "comment",
        foldStartIndex: from + (indexOfSlashes > -1 ? indexOfSlashes + 2 : 0),
      });
    }
    return true;
  } else {
    context.finishFoldableComment(i);
    return false;
  }
}

function checkTagColors(
  line: string,
  i: number,
  lengthAtIndex: number[],
  context: ParsingContext
): boolean {
  const tagColorMatch = line.match(TAG_COLOR_REGEX);
  if (tagColorMatch) {
    const tagName = tagColorMatch[1];
    const colorDef = tagColorMatch[2];
    const humanColorIndex = HUMAN_COLORS.indexOf(colorDef);
    if (humanColorIndex === -1) {
      const rgb = hexToRgb(colorDef);
      if (rgb) {
        context.tags[tagName] = rgb;
      } else {
        context.tags[tagName] = COLORS[context.paletteIndex++ % COLORS.length];
      }
    } else {
      context.tags[tagName] = COLORS[humanColorIndex];
    }
    const indexOfTag = line.indexOf(tagName);
    const from = lengthAtIndex[i] + indexOfTag - 1;
    context.ranges.push({
      type: "tag",
      from,
      to: from + tagName.length + 1,
      content: { tag: tagName, color: context.tags[tagName] },
    });
    context.ranges.push({
      type: "tagDefinition",
      from,
      to: from + line.indexOf(colorDef) + colorDef.length,
      content: { tag: tagName, color: context.tags[tagName] },
    });
    return true;
  }
  return false;
}

function checkDateFormat(line: string, context: ParsingContext) {
  if (line.match(DATE_FORMAT_REGEX)) {
    context.dateFormat = EUROPEAN_DATE_FORMAT;
    return true;
  }
  return false;
}

function checkTitle(
  line: string,
  i: number,
  lengthAtIndex: number[],
  context: ParsingContext
): boolean {
  const titleMatch = line.match(TITLE_REGEX);
  if (titleMatch) {
    context.title = titleMatch[2].trim();
    const titleTagIndex = line.indexOf(titleMatch[1]);
    context.ranges.push({
      type: "title",
      from: lengthAtIndex[i] + titleTagIndex,
      to: lengthAtIndex[i] + titleTagIndex + titleMatch[1].length,
    });
    return true;
  }
  return false;
}

function checkViewers(
  line: string,
  i: number,
  lengthAtIndex: number[],
  context: ParsingContext
): boolean {
  const viewersMatch = line.match(VIEWERS_REGEX);
  if (viewersMatch) {
    const viewTagIndex = line.indexOf(viewersMatch[1]);
    context.viewers = viewersMatch[2]
      .trim()
      .split(/ |,/)
      .filter((email) => !!email && email.includes("@"));
    context.ranges.push({
      type: "view",
      from: lengthAtIndex[i] + viewTagIndex,
      to: lengthAtIndex[i] + viewTagIndex + viewersMatch[1].length,
    });
    const viewerRanges = [] as Range[];
    for (let j = 0; j < context.viewers.length; j++) {
      const index = line.indexOf(
        context.viewers[j],
        viewerRanges.length
          ? viewerRanges[viewerRanges.length - 1].from - lengthAtIndex[i]
          : 0
      );
      viewerRanges.push({
        type: "viewer",
        from: lengthAtIndex[i] + index,
        to: lengthAtIndex[i] + index + context.viewers[j].length,
      });
    }
    context.ranges.push(...viewerRanges);
    return true;
  }
  return false;
}

function checkDescription(
  line: string,
  i: number,
  lengthAtIndex: number[],
  context: ParsingContext
): boolean {
  const descriptionMatch = line.match(DESCRIPTION_REGEX);
  if (descriptionMatch) {
    context.description = descriptionMatch[2];
    const descriptionTagIndex = line.indexOf(descriptionMatch[1]);
    context.ranges.push({
      type: "description",
      from: lengthAtIndex[i] + descriptionTagIndex,
      to: lengthAtIndex[i] + descriptionTagIndex + descriptionMatch[1].length,
    });
    return true;
  }
  return false;
}

function checkTags(
  line: string,
  i: number,
  lengthAtIndex: number[],
  context: ParsingContext
): boolean {
  const matches = line.matchAll(TAG_REGEX);
  if (matches) {
    for (let m of matches) {
      if (!context.tags[m[1]]) {
        context.tags[m[1]] = COLORS[context.paletteIndex++ % COLORS.length];
      }
      const from = lengthAtIndex[i] + line.indexOf("#" + m[1]);
      context.ranges.push({
        type: "tag",
        from,
        to: from + m[1].length + 1,
        content: { tag: m[1], color: context.tags[m[1]] },
      });
    }
  }
  return false;
}

function checkGroupStart(
  line: string,
  i: number,
  lengthAtIndex: number[],
  context: ParsingContext
): boolean {
  const groupStart = line.match(GROUP_START_REGEX);
  if (groupStart) {
    // We're starting a new group here. If there was a previous group, end it and
    // push it.
    if (context.eventSubgroup) {
      context.events.push(context.eventSubgroup);
    }

    context.finishFoldableSection(i, lengthAtIndex[i] - 1);
    context.ranges.push({
      from: lengthAtIndex[i],
      to: lengthAtIndex[i] + groupStart[0].length,
      type: "section",
    });
    context.eventSubgroup = parseGroupFromStartTag(line, groupStart);

    // Make new foldable
    context.foldables["section"] = {
      type: "section",
      startLine: i,
      startIndex: lengthAtIndex[i],
      endIndex: lengthAtIndex[i] + line.length,
      foldStartIndex: lengthAtIndex[i] + line.length,
    };

    return true;
  }
  return false;
}

function checkGroupEnd(
  line: string,
  i: number,
  lengthAtIndex: number[],
  context: ParsingContext
): boolean {
  if (context.eventSubgroup && line.match(GROUP_END_REGEX)) {
    // We are ending our subgroup
    context.events.push(context.eventSubgroup);
    context.eventSubgroup = undefined;
    context.ranges.push({
      from: lengthAtIndex[i],
      to: lengthAtIndex[i] + line.length,
      type: "section",
    });
    context.finishFoldableSection(i, lengthAtIndex[i] + line.length);
    return true;
  }
  return false;
}

function checkNonEvents(
  line: string,
  i: number,
  lengthAtIndex: number[],
  context: ParsingContext
): boolean {
  return (
    checkComments(line, i, lengthAtIndex, context) ||
    checkTagColors(line, i, lengthAtIndex, context) ||
    checkDateFormat(line, context) ||
    checkTitle(line, i, lengthAtIndex, context) ||
    checkViewers(line, i, lengthAtIndex, context) ||
    checkDescription(line, i, lengthAtIndex, context) ||
    checkTags(line, i, lengthAtIndex, context) ||
    checkGroupStart(line, i, lengthAtIndex, context) ||
    checkGroupEnd(line, i, lengthAtIndex, context)
  );
}

function getPriorEvent(context: ParsingContext): Event | undefined {
  if (context.eventSubgroup && context.eventSubgroup.length) {
    return context.eventSubgroup[context.eventSubgroup.length - 1];
  }
  if (context.events && context.events.length) {
    const previous = context.events[context.events.length - 1];
    if (previous instanceof Event) {
      return previous;
    } else {
      return previous[previous.length - 1];
    }
  }
}

function getPriorEventToDateTime(
  context: ParsingContext
): DateTime | undefined {
  const priorEvent = getPriorEvent(context);
  if (!priorEvent) {
    return;
  }
  return priorEvent.ranges.date.toDateTime;
}

function getPriorEventFromDateTime(context: ParsingContext) {
  debugger;
  const priorEvent = getPriorEvent(context);
  if (!priorEvent) {
    return;
  }
  return priorEvent.ranges.date.fromDateTime;
}

function getDateRangeFromEDTFRegexMatch(
  line: string,
  i: number,
  lengthAtIndex: number[],
  context: ParsingContext
): DateRangePart | undefined {
  const eventStartLineRegexMatch = line.match(EDTF_START_REGEX);
  if (!eventStartLineRegexMatch) {
    return;
  }
  const datePart = eventStartLineRegexMatch[edtfDatePartMatchIndex];

  const edtfFrom = eventStartLineRegexMatch[from_edtfDateIndex];
  const edtfFromHasMonth = !!eventStartLineRegexMatch[from_edtfDateMonthPart];
  const edtfFromHasDay = !!eventStartLineRegexMatch[from_edtfDateDayPart];

  const eventEndDate = eventStartLineRegexMatch[to_edtfIndex];
  const edtfTo = eventStartLineRegexMatch[to_edtfDateIndex];
  const edtfToHasMonth = !!eventStartLineRegexMatch[to_edtfDateMonthPart];
  const edtfToHasDay = !!eventStartLineRegexMatch[to_edtfDateDayPart];
  const relativeFromBeforeOrAfter =
    eventStartLineRegexMatch[from_edtfBeforeOrAfterMatchIndex];
  const relativeToBeforeOrAfter =
    eventStartLineRegexMatch[to_edtfBeforeOrAfterMatchIndex];

  const relativeFromDate =
    eventStartLineRegexMatch[from_edtfRelativeMatchIndex];
  const fromBeforeOrAfter = ["before", "by"].includes(
    relativeFromBeforeOrAfter || ""
  )
    ? "before"
    : "after";
  const relativeToDate = eventStartLineRegexMatch[to_edtfRelativeMatchIndex];
  const toBeforeOrAfter = ["before", "by"].includes(
    relativeToBeforeOrAfter || ""
  )
    ? "before"
    : "after";

  const nowFrom = eventStartLineRegexMatch[from_edtfNowMatchIndex];
  const nowTo = eventStartLineRegexMatch[to_edtfNowMatchIndex];

  let fromDateTime: DateTime | undefined;
  let endDateTime: DateTime | undefined;
  let granularity: DateTimeGranularity = "instant";
  if (edtfFrom) {
    fromDateTime = DateTime.fromISO(edtfFrom);
    granularity = edtfFromHasDay ? "day" : edtfFromHasMonth ? "month" : "year";
  } else if (relativeFromDate) {
    const relativeToEventId =
      eventStartLineRegexMatch[from_edtfRelativeEventIdMatchIndex];

    let relativeTo =
      relativeToEventId &&
      (fromBeforeOrAfter === "after"
        ? context.ids[relativeToEventId]?.ranges.date.toDateTime
        : context.ids[relativeToEventId]?.ranges.date.fromDateTime);

    if (!relativeTo) {
      const priorEvent = getPriorEvent(context);
      if (!priorEvent) {
        relativeTo = DateTime.now();
      } else {
        relativeTo =
          fromBeforeOrAfter === "after"
            ? priorEvent.ranges.date.toDateTime
            : priorEvent.ranges.date.fromDateTime;
      }
    }

    if (!relativeToDate && !eventEndDate) {
      // We don't have an end date set. Instead of using the relative
      // from date to determine the start time, we're going to use
      // the end time of the previous event as the start and make the
      // duration the provided relative time.

      if (fromBeforeOrAfter === "before") {
        // In the case of this being a 'before' relative date, the
        // end date is relativeTo and the start date is `amount` before it.
        endDateTime = relativeTo;
        fromDateTime = RelativeDate.from(relativeFromDate, relativeTo, true);
      } else {
        fromDateTime = relativeTo;
        endDateTime = RelativeDate.from(relativeFromDate, relativeTo);
      }
    } else {
      if (fromBeforeOrAfter === "before") {
        if (relativeToDate) {
          // in this case we're actually determining the end dateTime, with its duration,
          // or start time, to be figured out from the eventEndDate
          endDateTime = RelativeDate.from(relativeFromDate, relativeTo, true);
          fromDateTime = RelativeDate.from(relativeToDate, endDateTime, true);
        } else {
          // In this case we have an eventEndDate but it is not relative
        }
      } else {
        fromDateTime = RelativeDate.from(relativeFromDate, relativeTo);
      }
    }
    granularity = "instant";
  } else if (nowFrom) {
    fromDateTime = DateTime.now();
    granularity = "instant";
  } else {
    fromDateTime = DateTime.fromISO(edtfFrom);
    granularity = "instant";
  }

  if (!fromDateTime || !fromDateTime?.isValid) {
    fromDateTime = DateTime.now();
    granularity = "instant";
  }

  if (!endDateTime) {
    if (relativeToDate) {
      const relativeToEventId =
        eventStartLineRegexMatch[to_edtfRelativeEventIdMatchIndex];
      let relativeTo =
        relativeToEventId &&
        context.ids[relativeToEventId]?.ranges.date.toDateTime;
      if (!relativeTo) {
        // We do not have an event to refer to by id, use the start of this event
        relativeTo = fromDateTime;
      }
      endDateTime = RelativeDate.from(relativeToDate, relativeTo);
    } else if (nowTo) {
      endDateTime = DateTime.now();
      granularity = "instant";
    } else if (edtfTo) {
      endDateTime = DateRangePart.roundDateUp({
        dateTime: DateTime.fromISO(edtfTo),
        granularity: edtfToHasDay ? "day" : edtfToHasMonth ? "month" : "year",
      });
    }
  }

  if (!endDateTime || !endDateTime.isValid) {
    endDateTime = DateRangePart.roundDateUp({
      dateTime: fromDateTime,
      granularity,
    });
  }

  const indexOfDateRange = line.indexOf(datePart);
  const dateRangeInText = {
    type: "dateRange",
    from: lengthAtIndex[i] + indexOfDateRange,
    to: lengthAtIndex[i] + indexOfDateRange + datePart.length + 1,
  };
  context.ranges.push(dateRangeInText);

  const dateRange = new DateRangePart(
    fromDateTime,
    endDateTime,
    datePart,
    dateRangeInText
  );
  return dateRange;
}

function getDateRangeFromCasualRegexMatch(
  line: string,
  i: number,
  lengthAtIndex: number[],
  context: ParsingContext
): DateRangePart | undefined {
  const eventStartLineRegexMatch = line.match(EVENT_START_REGEX);
  if (!eventStartLineRegexMatch) {
    return;
  }
  // What the regex matched as the date range part
  const datePart = eventStartLineRegexMatch[datePartMatchIndex];
  const eventStartDate = eventStartLineRegexMatch[from_matchIndex];
  const eventEndDate = eventStartLineRegexMatch[to_matchIndex];

  const relativeFromDate = eventStartLineRegexMatch[from_relativeMatchIndex];
  const relativeFromBeforeOrAfter =
    eventStartLineRegexMatch[from_beforeOrAfterMatchIndex];
  const fromBeforeOrAfter = ["before", "by"].includes(
    relativeFromBeforeOrAfter || ""
  )
    ? "before"
    : "after";
  const relativeToDate = eventStartLineRegexMatch[to_relativeMatchIndex];
  const relativeToBeforeOrAfter =
    eventStartLineRegexMatch[to_beforeOrAfterMatchIndex];
  const toBeforeOrAfter = ["before", "by"].includes(
    relativeToBeforeOrAfter || ""
  )
    ? "before"
    : "after";

  const fromCasual = fromCasualDateFrom(eventStartLineRegexMatch);
  const toCasual = fromCasualDateTo(eventStartLineRegexMatch);

  const slashDateFrom = eventStartLineRegexMatch[from_slashDateFullMatchIndex];
  const slashDateTo = eventStartLineRegexMatch[to_slashDateFullMatchIndex];

  const timeOnlyFrom = eventStartLineRegexMatch[from_timeOnlyMatchIndex];
  const timeOnlyTo = eventStartLineRegexMatch[to_timeOnlyMatchIndex];

  const nowFrom = eventStartLineRegexMatch[from_nowMatchIndex];
  const nowTo = eventStartLineRegexMatch[to_nowMatchIndex];

  let fromDateTime: DateTime | undefined;
  let endDateTime: DateTime | undefined;
  let granularity: DateTimeGranularity = "instant";
  if (relativeFromDate) {
    const relativeToEventId =
      eventStartLineRegexMatch[from_relativeEventIdMatchIndex];

    let relativeTo =
      relativeToEventId &&
      (fromBeforeOrAfter === "after"
        ? context.ids[relativeToEventId]?.ranges.date.toDateTime
        : context.ids[relativeToEventId]?.ranges.date.fromDateTime);

    if (!relativeTo) {
      const priorEvent = getPriorEvent(context);
      if (!priorEvent) {
        relativeTo = DateTime.now();
      } else {
        relativeTo =
          fromBeforeOrAfter === "after"
            ? priorEvent.ranges.date.toDateTime
            : priorEvent.ranges.date.fromDateTime;
      }
    }

    if (!relativeToDate && !eventEndDate) {
      if (fromBeforeOrAfter === "before") {
        // In the case of this being a 'before' relative date, the
        // end date is relativeTo and the start date is `amount` before it.
        endDateTime = relativeTo;
        fromDateTime = RelativeDate.from(relativeFromDate, relativeTo, true);
      } else {
        fromDateTime = relativeTo;
        endDateTime = RelativeDate.from(relativeFromDate, relativeTo);
      }
    } else {
      if (fromBeforeOrAfter === "before") {
        if (relativeToDate) {
          // in this case we're actually determining the end dateTime, with its duration,
          // or start time, to be figured out from the eventEndDate
          endDateTime = RelativeDate.from(relativeFromDate, relativeTo, true);
          fromDateTime = RelativeDate.from(relativeToDate, endDateTime, true);
        } else {
          // In this case we have an eventEndDate but it is not relative
        }
      } else {
        fromDateTime = RelativeDate.from(relativeFromDate, relativeTo);
      }
    }
    granularity = "instant";
  } else if (fromCasual) {
    fromDateTime = fromCasual.dateTime;
    granularity = fromCasual.granularity;
  } else if (slashDateFrom) {
    const timeComponent =
      eventStartLineRegexMatch[from_slashDateTimeMatchIndex];
    let slashPart = slashDateFrom;
    if (timeComponent) {
      slashPart = slashPart
        .substring(0, slashPart.indexOf(timeComponent))
        .trim();
    }

    const parsed = DateRangePart.parseSlashDate(slashPart, context.dateFormat);
    if (parsed) {
      if (timeComponent) {
        const timePart = getTimeFromSlashDateFrom(eventStartLineRegexMatch);
        fromDateTime = parsed.dateTime.set({
          hour: timePart.dateTime.hour,
          minute: timePart.dateTime.minute,
        });
        granularity = timePart.granularity;
      } else {
        fromDateTime = parsed.dateTime;
        granularity = parsed.granularity;
      }

      // Something non-ISO has come up, assume they want that
      context.preferredInterpolationFormat = context.dateFormat;
    } else {
      console.error("Was supposed to have slash date but couldn't parse it.");
    }
  } else if (timeOnlyFrom) {
    const timeFrom = getTimeFromRegExpMatch(
      eventStartLineRegexMatch,
      from_timeOnlyMeridiemHourMatchIndex,
      from_timeOnlyMeridiemMinuteMatchIndex,
      from_timeOnlyMeridiemMeridiemMatchIndex,
      from_timeOnly24HourHourMatchIndex,
      from_timeOnly24HourMinuteMatchIndex
    );
    const priorEventDate = getPriorEventToDateTime(context) || DateTime.now();
    let priorEventWithParsedTime = priorEventDate.set({
      hour: timeFrom.dateTime.hour,
      minute: timeFrom.dateTime.minute,
    });
    if (priorEventWithParsedTime < priorEventDate) {
      priorEventWithParsedTime = priorEventWithParsedTime.plus({ days: 1 });
      fromDateTime = priorEventWithParsedTime;
      granularity = timeFrom.granularity;
    } else {
      fromDateTime = priorEventWithParsedTime;
      granularity = timeFrom.granularity;
    }
  } else if (nowFrom) {
    fromDateTime = DateTime.now();
    granularity = "instant";
  } else {
    fromDateTime = DateTime.fromISO(eventStartDate);
    granularity = "instant";
  }

  if (!fromDateTime || !fromDateTime.isValid) {
    fromDateTime = DateTime.now();
    granularity = "instant";
  }

  if (!endDateTime) {
    if (relativeToDate) {
      const relativeToEventId =
        eventStartLineRegexMatch[to_relativeEventIdMatchIndex];
      let relativeTo =
        relativeToEventId &&
        context.ids[relativeToEventId]?.ranges.date.toDateTime;
      if (!relativeTo) {
        // We do not have an event to refer to by id, use the start of this event
        relativeTo = fromDateTime;
      }
      endDateTime = RelativeDate.from(eventEndDate, relativeTo);
    } else if (toCasual) {
      endDateTime = DateRangePart.roundDateUp(toCasual);
    } else if (slashDateTo) {
      const timeComponent =
        eventStartLineRegexMatch[to_slashDateTimeMatchIndex];
      let slashPart = slashDateTo;
      if (timeComponent) {
        slashPart = slashPart.substring(0, slashPart.indexOf(timeComponent));
      }

      const parsed = DateRangePart.parseSlashDate(
        slashPart,
        context.dateFormat
      );
      if (parsed) {
        if (timeComponent) {
          const timePart = getTimeFromSlashDateTo(eventStartLineRegexMatch);
          endDateTime = parsed.dateTime.set({
            hour: timePart.dateTime.hour,
            minute: timePart.dateTime.minute,
          });
          endDateTime = DateRangePart.roundDateUp({
            dateTime: endDateTime,
            granularity: timePart.granularity,
          });
        } else {
          endDateTime = DateRangePart.roundDateUp(parsed);
        }

        // Something non-ISO has come up, assume they want that
        context.preferredInterpolationFormat = context.dateFormat;
      } else {
        console.error("Was supposed to have slash date but couldn't parse it.");
      }
    } else if (timeOnlyTo) {
      const timeTo = getTimeFromRegExpMatch(
        eventStartLineRegexMatch,
        to_timeOnlyMeridiemHourMatchIndex,
        to_timeOnlyMeridiemMinuteMatchIndex,
        to_timeOnlyMeridiemMeridiemMatchIndex,
        to_timeOnly24HourHourMatchIndex,
        to_timeOnly24HourMinuteMatchIndex
      );
      let eventStartWithTimeTo = fromDateTime.set({
        hour: timeTo.dateTime.hour,
        minute: timeTo.dateTime.minute,
      });
      if (eventStartWithTimeTo < fromDateTime) {
        eventStartWithTimeTo = eventStartWithTimeTo.plus({ days: 1 });
      }
      endDateTime = eventStartWithTimeTo;
      granularity = timeTo.granularity;
    } else if (nowTo) {
      endDateTime = DateTime.now();
      granularity = "instant";
    } else {
      endDateTime = DateRangePart.roundDateUp({
        dateTime: DateTime.fromISO(eventEndDate),
        granularity: "instant",
      });
    }
  }
  if (!endDateTime || !endDateTime.isValid) {
    endDateTime = DateRangePart.roundDateUp({
      dateTime: fromDateTime,
      granularity,
    });
  }

  const indexOfDateRange = line.indexOf(datePart);
  const dateRangeInText = {
    type: "dateRange",
    from: lengthAtIndex[i] + indexOfDateRange,
    to: lengthAtIndex[i] + indexOfDateRange + datePart.length + 1,
  };
  context.ranges.push(dateRangeInText);

  const dateRange = new DateRangePart(
    fromDateTime,
    endDateTime,
    datePart,
    dateRangeInText
  );
  return dateRange;
}

function checkEvent(
  line: string,
  lines: string[],
  i: number,
  lengthAtIndex: number[],
  context: ParsingContext
): number {
  let dateRange = getDateRangeFromEDTFRegexMatch(
    line,
    i,
    lengthAtIndex,
    context
  );
  if (!dateRange) {
    dateRange = getDateRangeFromCasualRegexMatch(
      line,
      i,
      lengthAtIndex,
      context
    );
  }
  if (!dateRange) {
    return i;
  }

  const eventDuration = dateRange.toDateTime.diff(dateRange.fromDateTime);
  if (
    typeof context.maxDuration === "undefined" ||
    +eventDuration > +context.maxDuration
  ) {
    context.maxDuration = eventDuration;
  }

  let end = i;
  let nextLine;
  do {
    nextLine = lines[++end];
  } while (
    typeof nextLine === "string" &&
    !nextLine.match(EDTF_START_REGEX) &&
    !nextLine.match(EVENT_START_REGEX) &&
    !nextLine.match(GROUP_START_REGEX) &&
    !nextLine.match(PAGE_BREAK_REGEX) &&
    !(context.eventSubgroup && nextLine.match(GROUP_END_REGEX))
  );
  const eventGroup = lines.slice(i, end);

  const eventRange: Range = {
    from: dateRange.dateRangeInText.from,
    to: lengthAtIndex[end],
    type: "event",
  };

  const eventRanges = {
    date: dateRange,
    event: eventRange,
  };

  // Remove the date part from the first line
  const datePartOfLine = dateRange.originalString!;
  const indexOfDateRange = line.indexOf(datePartOfLine);
  eventGroup[0] = eventGroup[0]
    .substring(indexOfDateRange + datePartOfLine.length + 1)
    .trim();

  const eventDescription = new EventDescription(eventGroup);
  const event = new Event(line, eventRanges, eventDescription);

  if (event) {
    if (context.eventSubgroup) {
      context.eventSubgroup.push(event);
    } else {
      context.events.push(event);
    }

    if (event.event.id && !context.ids[event.event.id]) {
      context.ids[event.event.id] = event;
    }

    if (!context.earliest || dateRange.fromDateTime < context.earliest) {
      context.earliest = dateRange.fromDateTime;
    }
    if (!context.latest || dateRange.toDateTime > context.latest) {
      context.latest = dateRange.toDateTime;
    }
  }
  return end - 1;
}

function checkNewPage(
  line: string,
  i: number,
  startLineIndex: number,
  lengthAtIndex: number[],
  context: ParsingContext
): Timeline | undefined {
  if (line.match(PAGE_BREAK_REGEX)) {
    if (context.eventSubgroup) {
      context.events.push(context.eventSubgroup);
    }
    context.finishFoldableSection(i, lengthAtIndex[i] + line.length);
    return context.toTimeline(
      lengthAtIndex,
      startLineIndex,
      i,
      lengthAtIndex[i] - 1
    );
  }
}

export function parseTimeline(
  lines: string[],
  lengthAtIndex: number[],
  startLineIndex: number = 0
): Timeline {
  const context = new ParsingContext();
  for (let i = startLineIndex; i < lines.length; i++) {
    const line = lines[i];
    if (checkNonEvents(line, i, lengthAtIndex, context)) {
      continue;
    }

    const completedTimeline = checkNewPage(
      line,
      i,
      startLineIndex,
      lengthAtIndex,
      context
    );
    if (completedTimeline) {
      return completedTimeline;
    }

    // TODO: Setting i from the result of checkEvent here allows us to not needlessly reparse lines,
    // but also breaks folding of comments under events
    checkEvent(line, lines, i, lengthAtIndex, context);
  }

  if (context.eventSubgroup) {
    context.events.push(context.eventSubgroup);
  }
  return context.toTimeline(
    lengthAtIndex,
    startLineIndex,
    lines.length - 1,
    // As this is the last timeline, return the length of the whole string
    lengthAtIndex[lines.length - 1] + lines[lines.length - 1].length
  );
}

function getTimeFromRegExpMatch(
  eventStartMatches: RegExpMatchArray,
  meridiemHourIndex: number,
  meridiemMinuteIndex: number,
  meridiemIndex: number,
  time24HourHourIndex: number,
  time24HourMinuteIndex: number
): GranularDateTime {
  const timeMeridiemHour = eventStartMatches[meridiemHourIndex];
  const timeMeridiemMinute = eventStartMatches[meridiemMinuteIndex] || ":00";
  const timeMeridiem = eventStartMatches[meridiemIndex] || "am";

  if (timeMeridiemHour) {
    return {
      dateTime: DateTime.fromFormat(
        `${timeMeridiemHour}${timeMeridiemMinute}${timeMeridiem}`,
        "h:mma"
      ),
      granularity: timeMeridiemMinute === ":00" ? "hour" : "minute",
    };
  }

  const time24HourHour = eventStartMatches[time24HourHourIndex];
  const time24HourMinute = eventStartMatches[time24HourMinuteIndex];
  return {
    dateTime: DateTime.fromFormat(
      `${time24HourHour}${time24HourMinute}`,
      `${
        time24HourHour.length === 2 && time24HourHour[0] === "0" ? "HH" : "H"
      }:mm`
    ),
    granularity: time24HourMinute === ":00" ? "hour" : "minute",
  };
}

function getTimeFromSlashDateFrom(eventStartMatches: RegExpMatchArray) {
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

function getTimeFromSlashDateTo(eventStartMatches: RegExpMatchArray) {
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

function getTimeFromCasualMonthFrom(
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

function getTimeFromCasualMonthTo(eventStartMatches: RegExpMatchArray) {
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

function fromCasualDateFrom(
  eventStartMatches: RegExpMatchArray
): GranularDateTime | undefined {
  let month = eventStartMatches[from_monthFirstCasualMonthMonthFullMatchIndex];
  let day = eventStartMatches[from_monthFirstCasualMonthDayMatchIndex];
  let year =
    eventStartMatches[from_casualMonthAndDayYearMatchIndex] ||
    `${DateTime.now().year}`;

  let timeMatch =
    eventStartMatches[from_casualMonthTimeMatchIndex] &&
    getTimeFromCasualMonthFrom(eventStartMatches);

  let date =
    month &&
    day &&
    parseAsCasualDayFullMonth(`${year} ${month} ${parseInt(day)}`);

  month = eventStartMatches[from_monthFirstCasualMonthMonthAbbrMatchIndex];
  date =
    date ||
    (month &&
      day &&
      parseAsCasualDayAbbrMonth(`${year} ${month} ${parseInt(day)}`));

  day = eventStartMatches[from_dayFirstCasualMonthDayMatchIndex];
  month = eventStartMatches[from_dayFirstCasualMonthMonthFullMatchIndex];
  date =
    date ||
    (month &&
      day &&
      parseAsCasualDayFullMonth(`${year} ${month} ${parseInt(day)}`));

  month = eventStartMatches[from_dayFirstCasualMonthMonthAbbrMatchIndex];
  date =
    date ||
    (month &&
      day &&
      parseAsCasualDayAbbrMonth(`${year} ${month} ${parseInt(day)}`));

  if (date) {
    if (timeMatch) {
      date.dateTime = date.dateTime.set({
        hour: timeMatch.dateTime.hour,
        minute: timeMatch.dateTime.minute,
      });
      date.granularity = timeMatch.granularity;
    }
    return date;
  }

  year =
    eventStartMatches[from_casualMonthYearMatchIndex] ||
    `${DateTime.now().year}`;
  month = eventStartMatches[from_casualMonthMonthFullMatchIndex];
  if (month) {
    return {
      dateTime: DateTime.fromFormat(`${year} ${month}`, "y MMMM"),
      granularity: "month",
    };
  }
  month = eventStartMatches[from_casualMonthMonthAbbrMatchIndex];
  if (month) {
    return {
      dateTime: DateTime.fromFormat(`${year} ${month}`, "y MMM"),
      granularity: "month",
    };
  }
}

function fromCasualDateTo(
  eventStartMatches: RegExpMatchArray
): GranularDateTime | undefined {
  let month = eventStartMatches[to_monthFirstCasualMonthMonthFullMatchIndex];
  let day = eventStartMatches[to_monthFirstCasualMonthDayMatchIndex];
  let year =
    eventStartMatches[to_casualMonthAndDayYearMatchIndex] ||
    `${DateTime.now().year}`;

  let timeMatch =
    eventStartMatches[to_casualMonthTimeMatchIndex] &&
    getTimeFromCasualMonthTo(eventStartMatches);

  let date =
    month &&
    day &&
    parseAsCasualDayFullMonth(`${year} ${month} ${parseInt(day)}`);

  month = eventStartMatches[to_monthFirstCasualMonthMonthAbbrMatchIndex];
  date =
    date ||
    (month &&
      day &&
      parseAsCasualDayAbbrMonth(`${year} ${month} ${parseInt(day)}`));

  day = eventStartMatches[to_dayFirstCasualMonthDayMatchIndex];
  month = eventStartMatches[to_dayFirstCasualMonthMonthFullMatchIndex];
  date =
    date ||
    (month &&
      day &&
      parseAsCasualDayFullMonth(`${year} ${month} ${parseInt(day)}`));

  month = eventStartMatches[to_dayFirstCasualMonthMonthAbbrMatchIndex];
  date =
    date ||
    (month &&
      day &&
      parseAsCasualDayAbbrMonth(`${year} ${month} ${parseInt(day)}`));

  if (date) {
    if (timeMatch) {
      if (timeMatch) {
        date.dateTime = date.dateTime.set({
          hour: timeMatch.dateTime.hour,
          minute: timeMatch.dateTime.minute,
        });
        date.granularity = timeMatch.granularity;
      }
    }
    return date;
  }

  year =
    eventStartMatches[to_casualMonthYearMatchIndex] || `${DateTime.now().year}`;
  month = eventStartMatches[to_casualMonthMonthFullMatchIndex];
  if (month) {
    return {
      dateTime: DateTime.fromFormat(`${year} ${month}`, "y MMMM"),
      granularity: "month",
    };
  }
  month = eventStartMatches[to_casualMonthMonthAbbrMatchIndex];
  if (month) {
    return {
      dateTime: DateTime.fromFormat(`${year} ${month}`, "y MMM"),
      granularity: "month",
    };
  }
}

function parseAsCasualDayFullMonth(s: string): GranularDateTime {
  return {
    dateTime: DateTime.fromFormat(s, "y MMMM d"),
    granularity: "day",
  };
}

function parseAsCasualDayAbbrMonth(s: string): GranularDateTime {
  return {
    dateTime: DateTime.fromFormat(s, "y MMM d"),
    granularity: "day",
  };
}

function parseGroupFromStartTag(
  s: string,
  regexMatch: RegExpMatchArray
): EventSubGroup {
  const group: EventSubGroup = [];
  group.tags = [];
  group.style = "group";

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
