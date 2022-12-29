import { DateTime, Duration } from "luxon";
import { Foldable } from ".";
import { Cache } from "./Cache";
import { Node, NodeArray, SomeNode } from "./Node";
import {
  AMOUNT_REGEX,
  COMMENT_REGEX,
  EVENT_ID_REGEX,
  TAG_REGEX,
} from "./regex";
import { addHttpIfNeeded } from "./utilities/html";

export type DateTimeGranularity =
  | "instant"
  | "year"
  | "month"
  | "day"
  | "hour"
  | "minute";

export type GranularDateTime = {
  dateTimeIso: DateTimeIso;
  granularity: DateTimeGranularity;
};

export type DateFormat =
  | typeof AMERICAN_DATE_FORMAT
  | typeof EUROPEAN_DATE_FORMAT;
export const AMERICAN_DATE_FORMAT = "M/d/y";
export const EUROPEAN_DATE_FORMAT = "d/M/y";

export const DATE_TIME_FORMAT_MONTH_YEAR = "M/y";
export const DATE_TIME_FORMAT_YEAR = "y";

export class RelativeDate {
  static from(
    raw: string,
    priorDate: DateTime,
    before: boolean = false
  ): DateTime {
    const matches = raw.matchAll(AMOUNT_REGEX);
    let match = matches.next();

    const plusOrMinus = before ? "minus" : "plus";

    while (match.value) {
      const value = match.value as RegExpMatchArray;
      const amount = parseInt(value[1]);
      if (value[3]) {
        priorDate = priorDate[plusOrMinus]({ milliseconds: amount });
      } else if (value[4]) {
        priorDate = priorDate[plusOrMinus]({ seconds: amount });
      } else if (value[5]) {
        priorDate = priorDate[plusOrMinus]({ minutes: amount });
      } else if (value[6]) {
        priorDate = priorDate[plusOrMinus]({ hours: amount });
      } else if (value[7]) {
        priorDate = before
          ? removeWeekdays(amount, priorDate)
          : addWeekdays(amount, priorDate);
      } else if (value[8]) {
        priorDate = priorDate[plusOrMinus]({ days: amount });
      } else if (value[9]) {
        priorDate = priorDate[plusOrMinus]({ weeks: amount });
      } else if (value[10]) {
        priorDate = priorDate[plusOrMinus]({ months: amount });
      } else if (value[11]) {
        priorDate = priorDate[plusOrMinus]({ years: amount });
      }
      match = matches.next();
    }
    return priorDate;
  }
}

function removeWeekdays(amount: number, fromDate: DateTime): DateTime {
  const currentWeekday = fromDate.weekday - 1;
  const lessThisWeek = amount - currentWeekday;

  if (lessThisWeek <= 0) {
    // We have enough this week, just subtract the days
    return fromDate.minus({ days: amount });
  }

  const numDaysInWeekend = 2;
  const numDaysInWeek = 7;
  const numWorkDaysInWeek = 5;

  const firstWeek = currentWeekday;

  const weeks = ~~(lessThisWeek / numWorkDaysInWeek);
  const remainder = lessThisWeek % numWorkDaysInWeek;

  const days = weeks * numDaysInWeek;
  const lastWeek = remainder ? numDaysInWeekend + remainder : 0;
  return fromDate.minus({ days: firstWeek + days + lastWeek });
}

function addWeekdays(amount: number, toDate: DateTime): DateTime {
  const currentWeekday = toDate.weekday;

  const saturday = 6;
  const thisWeek = saturday - currentWeekday;

  const lessThisWeek = amount - thisWeek;
  if (lessThisWeek <= 0) {
    // We have enough this week, just add the days
    return toDate.plus({ days: amount });
  } else {
    const numDaysInWeekend = 2;
    const numDaysInWeek = 7;
    const numWorkDaysInWeek = 5;

    const firstWeek = thisWeek;

    const weeks = ~~(lessThisWeek / numWorkDaysInWeek);
    const remainder = lessThisWeek % numWorkDaysInWeek;

    // Get up through Friday
    const days = weeks * numDaysInWeek;

    // If there's a remainder, add the last weekend back
    const lastWeek = remainder ? numDaysInWeekend + remainder : 0;
    return toDate.plus({ days: firstWeek + days + lastWeek });
  }
}

export interface DateRange {
  fromDateTime: DateTime;
  toDateTime: DateTime;
}

export type DateTimeIso = string;

export class DateRangePart implements DateRange {
  fromDateTime: DateTime;
  toDateTime: DateTime;
  originalString?: string;
  dateRangeInText: Range;

  constructor(
    fromDateTime: DateTime,
    toDateTime: DateTime,
    originalString: string,
    dateRangeInText: Range
  ) {
    this.fromDateTime = fromDateTime;
    this.toDateTime = toDateTime;
    this.originalString = originalString;
    this.dateRangeInText = dateRangeInText;
  }
}

export const LINK_REGEX =
  /\[([^\]\<\>]+)\]\(((https?:\/\/)?[\w\d./\&\?=\-#:,_]+)\)/g;
export const LOCATION_REGEX = /\[([^\]]+)\]\((location|map)\)/g;
export const IMAGE_REGEX =
  /!\[([^\]\<\>]*)\]\(((https?:\/\/)?[\w\d./\&\?=\-#:,_]+)\)/;
export const AT_REGEX = /@([\w\d\/]+)/g;
const PERCENT_REGEX = /(?:\s|^)(\d{1,3})%(?:\s|$)/;

export enum BlockType {
  TEXT = "text",
  LIST_ITEM = "listItem",
  CHECKBOX = "checkbox",
  IMAGE = "image",
}

export interface MarkdownBlock {
  type: BlockType;
}

export class Block implements MarkdownBlock {
  type: BlockType;
  value?: any;
  raw: string;

  constructor(raw: string) {
    this.raw = raw;
    if (raw.startsWith("- []")) {
      this.type = BlockType.CHECKBOX;
      this.value = false;
      this.raw = raw.substring(4).trim();
    } else if (raw.startsWith("- [ ]")) {
      this.type = BlockType.CHECKBOX;
      this.value = false;
      this.raw = raw.substring(5).trim();
    } else if (raw.startsWith("- [x]")) {
      this.type = BlockType.CHECKBOX;
      this.value = true;
      this.raw = raw.substring(5).trim();
    } else if (raw.startsWith("- ")) {
      this.type = BlockType.LIST_ITEM;
      this.raw = raw.substring(2);
    } else {
      this.type = BlockType.TEXT;
    }
  }
}

export class Image implements MarkdownBlock {
  type = "image" as BlockType;

  altText: string;
  link: string;

  constructor(altText: string, link: string) {
    this.altText = altText;
    this.link = link;
  }
}

export class EventDescription {
  eventDescription: string;
  tags: string[] = [];
  supplemental = [] as MarkdownBlock[];
  matchedListItems: Range[];
  locations: string[] = [];
  id?: string;
  percent?: number;
  completed?: boolean;

  constructor(lines: string[], matchedListItems: Range[], completed?: boolean) {
    this.matchedListItems = matchedListItems;
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      if (line.match(COMMENT_REGEX)) {
        continue;
      }
      // only get the image if it's on the first line, others will be scooped up by supplemental
      if (i === 0) {
        line = line.replace(
          IMAGE_REGEX,
          (match, altText: string, link: string) => {
            this.supplemental.push(new Image(altText, addHttpIfNeeded(link)));
            return "";
          }
        );
      }
      line = line.replace(LOCATION_REGEX, (match, locationString) => {
        this.locations.push(locationString);
        return "";
      });
      line = line.replace(TAG_REGEX, (match, tag) => {
        if (!this.tags.includes(tag)) {
          this.tags.push(tag);
        }
        return "";
      });
      line = line.replace(EVENT_ID_REGEX, (match, id) => {
        if (!this.id) {
          this.id = id;
          return "";
        }
        return id;
      });
      if (!this.percent) {
        const percent = line.match(PERCENT_REGEX);
        if (percent) {
          this.percent = parseInt(percent[0]);
        }
      }
      lines[i] = line;
    }
    this.eventDescription = lines[0];
    this.supplemental = this.supplemental.concat(
      lines
        .slice(1)
        .filter((l) => !l.match(COMMENT_REGEX) && !!l.trim())
        .map((raw) => {
          raw = raw.replace(TAG_REGEX, (match, tag) => {
            if (!this.tags.includes(tag)) {
              this.tags.push(tag);
            }
            return "";
          });
          const image = raw.match(IMAGE_REGEX);
          if (image) {
            return new Image(image[1], addHttpIfNeeded(image[2]));
          } else {
            return new Block(raw.trim());
          }
        })
    );
    this.completed = completed;
  }
}

export enum RangeType {
  Comment = "comment",
  CheckboxItemIndicator = "checkboxItemIndicator",
  listItemIndicator = "listItemIndicator",
  ListItemContents = "listItemContents",
  Tag = "tag",
  tagDefinition = "tagDefinition",
  Title = "title",
  View = "view",
  Viewer = "viewer",
  Description = "description",
  Section = "section",
  DateRange = "dateRange",
  Event = "event",
  Edit = "edit",
  Editor = "editor",
}

export interface Line {
  line: number;
  index: number;
}

export type Range = {
  from: number;
  to: number;
  type: RangeType;
  content?: any;
  lineFrom: Line;
  lineTo: Line;
};

export interface DateRangeIso {
  fromDateTimeIso: DateTimeIso;
  toDateTimeIso: DateTimeIso;
}

export const toDateRangeIso = (dr: DateRange) => ({
  fromDateTimeIso: dr.fromDateTime.toISO(),
  toDateTimeIso: dr.toDateTime.toISO(),
});

export const toDateRange = (dr: DateRangeIso) => ({
  fromDateTime: DateTime.fromISO(dr.fromDateTimeIso),
  toDateTime: DateTime.fromISO(dr.toDateTimeIso),
});

export class Event {
  eventString: string;
  dateRangeIso: DateRangeIso;
  rangeInText: Range;
  eventDescription: EventDescription;
  dateText?: string;
  dateRangeInText: Range;

  constructor(
    eventString: string,
    dateRange: DateRange,
    rangeInText: Range,
    dateRangeInText: Range,
    event: EventDescription,
    dateText?: string
  ) {
    this.eventString = eventString;
    this.dateRangeIso = toDateRangeIso(dateRange);
    this.rangeInText = rangeInText;
    this.eventDescription = event;
    this.dateText = dateText;
    this.dateRangeInText = dateRangeInText;
  }
}

export type Tags = { [tagName: string]: string };
export type IdedEvents = { [id: string]: Event };
export interface Timeline {
  ranges: Range[];
  foldables: { [index: number]: Foldable };
  events: Node<NodeArray>;
  head?: SomeNode;
  tail?: SomeNode;
  tags: Tags;
  ids: IdedEvents;
  metadata: TimelineMetadata;
}

export function emptyTimeline(): Timeline {
  const now = DateTime.now();
  return {
    events: new Node([]),
    ranges: [],
    foldables: [],
    tags: {},
    ids: {},
    metadata: {
      earliestTime: now.minus({ years: 5 }).toISO(),
      latestTime: now.plus({ years: 5 }).toISO(),
      maxDurationDays: now.diff(now.minus({ years: 1 })).as("days"),
      dateFormat: AMERICAN_DATE_FORMAT,
      startLineIndex: 0,
      endLineIndex: 0,
      startStringIndex: 0,
      endStringIndex: 0,
      preferredInterpolationFormat: undefined,
      view: [],
      edit: [],
    },
  };
}

export interface Timelines {
  timelines: Timeline[];
  cache?: Cache;
}

export interface EventGroup extends Array<Event | EventGroup> {
  tags?: string[];
  title?: string;
  range?: {
    min: DateTime;
    max: DateTime;
    latest: DateTime;
  };
  startExpanded?: boolean;
  style?: GroupStyle;
  rangeInText?: Range;
}

export interface TimelineMetadata {
  earliestTime: DateTimeIso;
  latestTime: DateTimeIso;
  dateFormat: string;
  startLineIndex: number;
  startStringIndex: number;
  endLineIndex: number;
  endStringIndex: number;
  title?: string;
  description?: string;
  maxDurationDays: number;
  preferredInterpolationFormat: string | undefined;
  view: string[];
  edit: string[];
}

export type GroupStyle = "section" | "group";

export class Path extends Array<number> {
  static root(): Path {
    return Path.from([0]);
  }
}
