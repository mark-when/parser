import { DateTime, DurationLikeObject } from "luxon";
import { Caches } from "./Cache.js";
import { Recurrence, RecurrenceInText } from "./dateRange/checkRecurrence.js";
import { Foldable, ParseMessage } from "./ParsingContext.js";
import {
  AMOUNT_REGEX,
  COMMENT_REGEX,
  EVENT_ID_REGEX,
  TAG_REGEX,
} from "./regex.js";
import { addHttpIfNeeded } from "./utilities/html.js";

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
  /**
   * Note that this does not accurately work for week days as
   * we would otherwise need to know the date that this is
   * being diffed from.
   * @param raw
   */
  static diffFromString(raw: string) {
    const matches = raw.matchAll(AMOUNT_REGEX);
    let match = matches.next();
    const diffObj = {} as DurationLikeObject;
    while (match.value) {
      const value = match.value as RegExpMatchArray;
      const amount = parseInt(value[1]);
      if (value[3]) {
        diffObj["milliseconds"] = (diffObj["milliseconds"] ?? 0) + amount;
      } else if (value[4]) {
        diffObj["seconds"] = (diffObj["seconds"] ?? 0) + amount;
      } else if (value[5]) {
        diffObj["minutes"] = (diffObj["minutes"] ?? 0) + amount;
      } else if (value[6]) {
        diffObj["hours"] = (diffObj["hours"] ?? 0) + amount;
      } else if (value[7]) {
        // priorDate = before
        //   ? removeWeekdays(amount, priorDate)
        //   : addWeekdays(amount, priorDate);
      } else if (value[8]) {
        diffObj["days"] = (diffObj["days"] ?? 0) + amount;
      } else if (value[9]) {
        diffObj["weeks"] = (diffObj["weeks"] ?? 0) + amount;
      } else if (value[10]) {
        diffObj["months"] = (diffObj["months"] ?? 0) + amount;
      } else if (value[11]) {
        diffObj["years"] = (diffObj["years"] ?? 0) + amount;
      }
      match = matches.next();
    }
    return diffObj;
  }

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
  eventText: string;
  dateRangeInText: Range;
  recurrence?: Recurrence;
  recurrenceRangeInText?: Range;

  constructor(
    fromDateTime: DateTime,
    toDateTime: DateTime,
    originalString: string,
    dateRangeInText: Range,
    eventText: string,
    recurrence?: RecurrenceInText
  ) {
    this.fromDateTime = fromDateTime;
    this.toDateTime = toDateTime;
    this.originalString = originalString;
    this.dateRangeInText = dateRangeInText;
    this.eventText = eventText;
    this.recurrence = recurrence?.recurrence;
    this.recurrenceRangeInText = recurrence?.range;
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
  DateRangeColon = "dateRangeColon",
  Event = "event",
  Edit = "edit",
  Editor = "editor",
  Recurrence = "recurrence",
  FrontmatterDelimiter = "frontMatterDelimiter",
  HeaderKey = "headerKey",
  HeaderKeyColon = "headerKeyColon",
  HeaderValue = "headerValue",
  PropertyKey = "propertyKey",
  PropertyKeyColon = "propertyKeyColon",
  PropertyValue = "propertyValue",
}

export type Range = {
  from: number;
  to: number;
  type: RangeType;
  content?: any;
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

export type Eventy = Event | EventGroup;
export function isEvent(eventy: Eventy): eventy is Event {
  return !(eventy as EventGroup).children;
}
export function isGroup(eventy: Eventy): eventy is EventGroup {
  return !isEvent(eventy);
}
export type GroupRange = DateRange & { maxFrom: DateTime };
export class EventGroup {
  textRanges!: {
    whole: Range;
  };
  properties: [string, any][] = [];
  tags: string[] = [];
  title: string = "";
  range?: GroupRange;
  startExpanded?: boolean;
  style?: GroupStyle;

  children: Array<Event | EventGroup> = [];
}

export class Event {
  firstLine: {
    full: string;
    datePart?: string;
    rest: string;
    restTrimmed: string;
  };
  textRanges: {
    whole: Range;
    datePart: Range;
    recurrence?: Range;
  };
  properties: any[];
  dateRangeIso: DateRangeIso;
  recurrence?: Recurrence;
  tags: string[];
  supplemental: MarkdownBlock[];
  matchedListItems: Range[];
  id?: string;
  percent?: number;
  completed?: boolean;

  constructor(
    firstLine: string,
    properties: any[],
    dateRange: DateRangePart,
    rangeInText: Range,
    dateRangeInText: Range,
    eventDescription: EventDescription,
    dateText?: string
  ) {
    this.firstLine = {
      full: firstLine,
      datePart: dateText,
      rest: dateRange.eventText,
      restTrimmed: eventDescription.eventDescription,
    };
    this.properties = properties;
    this.textRanges = {
      whole: rangeInText,
      datePart: dateRangeInText,
      recurrence: dateRange.recurrenceRangeInText,
    };
    this.dateRangeIso = toDateRangeIso(dateRange);
    this.recurrence = dateRange.recurrence;
    this.tags = eventDescription.tags;
    this.supplemental = eventDescription.supplemental;
    this.matchedListItems = eventDescription.matchedListItems;
    this.id = eventDescription.id;
    this.percent = eventDescription.percent;
    this.completed = eventDescription.completed;
  }
}

export type Tags = { [tagName: string]: string };
export type IdedEvents = { [id: string]: number[] };
export interface Timeline {
  ranges: Range[];
  foldables: { [index: number]: Foldable };
  events: EventGroup;
  header: any;
  ids: IdedEvents;
  metadata: TimelineMetadata;
  parseMessages: ParseMessage[];
}

export function emptyTimeline(): Timeline {
  const now = DateTime.now();
  return {
    events: new EventGroup(),
    ranges: [],
    foldables: [],
    ids: {},
    header: { dateFormat: AMERICAN_DATE_FORMAT },
    metadata: {
      earliestTime: now.minus({ years: 5 }).toISO(),
      latestTime: now.plus({ years: 5 }).toISO(),
      maxDurationDays: now.diff(now.minus({ years: 1 })).as("days"),
      preferredInterpolationFormat: undefined,
    },
    parseMessages: [],
  };
}

export type ParseResult = Timeline & {
  cache?: Caches;
  parser: {
    version: string;
  };
};

export interface TimelineMetadata {
  earliestTime?: DateTimeIso;
  latestTime?: DateTimeIso;
  maxDurationDays: number;
  preferredInterpolationFormat: string | undefined;
}

export type GroupStyle = "section" | "group";

export type Path = number[];

export const toArray = (node: Eventy) => {
  const array = [] as { path: Path; eventy: Eventy }[];
  for (const pathAndNode of iter(node)) {
    array.push(pathAndNode);
  }
  return array;
};

export function* iter(
  eventy: Eventy,
  path: Path = []
): Generator<{ eventy: Eventy; path: number[] }> {
  yield { eventy, path };
  if (eventy && !isEvent(eventy)) {
    for (let i = 0; i < eventy.children.length; i++) {
      yield* iter(eventy.children[i], [...path, i]);
    }
  }
}

export const push = (
  node: Event | EventGroup,
  onto: EventGroup,
  path?: Path,
  tail?: Event
): { path: number[]; tail?: Event } => {
  if (!path || !path.length) {
    onto.children.push(node);
    if (!isEvent(node)) {
      return {
        path: [onto.children.length - 1, node.children.length],
        tail,
      };
    } else {
      return {
        path: [onto.children.length - 1],
        tail: node,
      };
    }
  } else {
    const { tail: newTail, path: newPath } = push(
      node,
      onto.children[path[0]] as EventGroup,
      path.slice(1),
      tail
    );
    return {
      path: [path[0], ...newPath],
      tail: newTail,
    };
  }
};

export const get = (root: Eventy, path: Path): Eventy | undefined => {
  if (!path.length) {
    return root;
  }
  // If it wasn't us and we don't have any nodes to offer,
  // return undefined
  const arr = root as EventGroup;
  if (!arr.children.length || arr.children.length - 1 < path[0]) {
    return undefined;
  }
  return get(arr.children[path[0]], path.slice(1));
};

export const getLast = (node: Eventy): { node: Eventy; path: Path } => {
  if (isEvent(node)) {
    return { node, path: [] };
  }
  if (!node.children.length) {
    return { node, path: [] };
  }
  const indexOfLast = node.children.length - 1;
  const result = getLast(node.children[indexOfLast]);
  return {
    node: result.node,
    path: [indexOfLast, ...result.path],
  };
};

export const flat = (node: Eventy) => flatMap(node, (n) => n) as Array<Event>;

export const flatMap = <T>(
  node: Eventy,
  mapper: (n: Eventy) => T
): Array<T> => {
  if (isEvent(node)) {
    return [mapper(node)];
  }
  return node.children.flatMap((n) => flatMap(n, mapper));
};

export const eventRange = (e: Event) => toDateRange(e.dateRangeIso);

export const ranges = (root?: Eventy): GroupRange | undefined => {
  if (!root) {
    return undefined;
  }

  if (isEvent(root)) {
    return {
      ...eventRange(root),
      maxFrom: eventRange(root).fromDateTime,
    };
  }

  const childRanges: GroupRange | undefined = root.children.reduce(
    (prev: GroupRange | undefined, curr) => {
      const currRange = ranges(curr);
      if (!prev) {
        return currRange;
      }
      if (!currRange) {
        return currRange;
      }

      const min =
        +currRange.fromDateTime < +prev.fromDateTime
          ? currRange.fromDateTime
          : prev.fromDateTime;
      const max =
        +currRange.toDateTime > +prev.toDateTime
          ? currRange.toDateTime
          : prev.toDateTime;
      const maxFrom =
        +currRange.maxFrom > +prev.maxFrom ? currRange.maxFrom : prev.maxFrom;

      const range = {
        fromDateTime: min,
        toDateTime: max,
        maxFrom,
      };
      return range;
    },
    undefined
  );

  return childRanges;
};
