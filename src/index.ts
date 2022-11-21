import { DateTime, Duration } from "luxon";
// import { Sort } from "./Sort";
import {
  Timeline,
  Event,
  EventDescription,
  IdedEvents,
  Tags,
  Range,
  DateRangePart,
  Timelines,
  emptyTimeline,
  AMERICAN_DATE_FORMAT,
  EUROPEAN_DATE_FORMAT,
  RangeType,
  Path,
  EventGroup,
} from "./Types";
import {
  GROUP_START_REGEX,
  GROUP_END_REGEX,
  PAGE_BREAK_REGEX,
  EVENT_START_REGEX,
  EDTF_START_REGEX,
} from "./regex";
import { checkComments } from "./lineChecks/checkComments";
import { checkDateFormat } from "./lineChecks/checkDateFormat";
import { checkDescription } from "./lineChecks/checkDescription";
import { checkEditors } from "./lineChecks/checkEditors";
import { checkGroupEnd } from "./lineChecks/checkGroupEnd";
import { checkGroupStart } from "./lineChecks/checkGroupStart";
import { checkListItems } from "./lineChecks/checkListItems";
import { checkTagColors } from "./lineChecks/checkTagColors";
import { checkTags } from "./lineChecks/checkTags";
import { checkTitle } from "./lineChecks/checkTitle";
import { checkViewers } from "./lineChecks/checkViewers";
import { getDateRangeFromCasualRegexMatch } from "./dateRange/getDateRangeFromCasualRegexMatch";
import { getDateRangeFromEDTFRegexMatch } from "./dateRange/getDateRangeFromEDTFRegexMatch";
import { Node, NodeArray, NodeValue, SomeNode } from "./Node";

// export const sorts: Sort[] = ["none", "down", "up"];

export interface Foldable {
  endIndex: number;
  type: "comment" | "section";
  startLine: number;
  startIndex?: number;
  foldStartIndex?: number;
}

export function parseDateRange(
  dateRangeString: string
): DateRangePart | undefined {
  const parsingContext = new ParsingContext();
  let dateRange = getDateRangeFromEDTFRegexMatch(
    dateRangeString,
    0,
    [],
    parsingContext
  );
  if (!dateRange) {
    dateRange = getDateRangeFromCasualRegexMatch(
      dateRangeString,
      0,
      [],
      parsingContext
    );
  }
  return dateRange;
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

export class ParsingContext {
  events: Node<NodeArray>;
  head?: SomeNode;
  tail?: SomeNode;
  currentPath: Path;

  tags: Tags;
  ids: IdedEvents;
  title: string | undefined;
  description: string | undefined;
  paletteIndex: number;
  dateFormat: typeof AMERICAN_DATE_FORMAT | typeof EUROPEAN_DATE_FORMAT;
  earliest: DateTime | undefined;
  latest: DateTime | undefined;
  maxDuration: Duration | undefined;
  foldables: {
    [F in number | string]: Foldable;
  };
  ranges: Range[];
  preferredInterpolationFormat: string | undefined;
  viewers: string[];
  editors: string[];

  constructor() {
    this.events = new Node([]);
    this.tags = {};
    this.ids = {};
    this.title = undefined;
    this.description = undefined;
    this.paletteIndex = 0;
    this.dateFormat = AMERICAN_DATE_FORMAT;
    this.earliest = undefined;
    this.latest = undefined;
    this.maxDuration = undefined;
    this.currentPath = [];
    this.foldables = {};
    this.ranges = [];
    this.viewers = [];
    this.editors = [];
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

  push(node: SomeNode) {
    const { path, tail: newTail } = this.events.push(
      node,
      this.tail,
      this.currentPath.slice(0, -1)
    );
    if (newTail) {
      if (!this.head) {
        this.head = newTail;
      }
      this.tail = newTail;
    }
    this.currentPath = path;
  }

  endCurrentGroup() {
    this.currentPath.pop();
  }

  // getCurrentGroup(): EventGroup {
  //   return this.get(this.currentPath);
  // }

  // get(path: Path): EventGroup {
  //   return this._get(path, this.events);
  // }

  // _get(path: Path, events: EventGroup): EventGroup {
  //   if (path.length === 0) {
  //     return events;
  //   }
  //   return this._get(path.splice(1), events[path[0]] as EventGroup);
  // }

  // pushEventOrGroup(e: Event | EventGroup) {
  //   const additionalNodeIndex = this._pushEventOrGroup(
  //     e,
  //     this.currentPath,
  //     this.events
  //   );
  //   if (additionalNodeIndex !== -1) {
  //     this.currentPath.push(additionalNodeIndex);
  //   }
  // }

  // _pushEventOrGroup(
  //   e: Event | EventGroup,
  //   path: Path,
  //   events: Node[]
  // ): number {
  //   if (path.length === 0) {
  //     events.push(e);
  //     if (Array.isArray(e)) {
  //       return events.length - 1;
  //     }
  //     return -1;
  //   } else {
  //     return this._pushEventOrGroup(
  //       e,
  //       path.slice(1),
  //       events[path[0]] as EventGroup
  //     );
  //   }
  // }

  toTimeline(
    lengthAtIndex: number[],
    startLineIndex: number,
    endLineIndex: number,
    endStringIndex: number
  ): Timeline {
    const now = DateTime.now();
    return {
      events: this.events,
      head: this.head,
      tail: this.tail,
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
        edit: this.editors,
      },
    };
  }
}

function checkNonEvents(
  line: string,
  i: number,
  lengthAtIndex: number[],
  context: ParsingContext
): boolean {
  return [
    checkComments,
    checkTagColors,
    checkDateFormat,
    checkTitle,
    checkViewers,
    checkEditors,
    checkDescription,
    checkTags,
    checkGroupStart,
    checkGroupEnd,
  ].some((f) => f(line, i, lengthAtIndex, context));
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

  const matchedListItems = [];
  while (true) {
    nextLine = lines[++end];
    if (
      typeof nextLine !== "string" ||
      nextLine.match(EDTF_START_REGEX) ||
      nextLine.match(EVENT_START_REGEX) ||
      nextLine.match(GROUP_START_REGEX) ||
      nextLine.match(PAGE_BREAK_REGEX) ||
      (context.currentPath.length > 1 && nextLine.match(GROUP_END_REGEX))
    ) {
      break;
    }

    checkComments(nextLine, end, lengthAtIndex, context);
    const listItems = checkListItems(nextLine, end, lengthAtIndex, context);
    if (listItems) {
      matchedListItems.push(...listItems);
    }
  }

  const eventGroup = lines.slice(i, end);

  const eventRange: Range = {
    from: dateRange.dateRangeInText.from,
    to: lengthAtIndex[end],
    type: RangeType.Event,
    lineFrom: {
      line: dateRange.dateRangeInText.lineFrom.line,
      index: dateRange.dateRangeInText.lineFrom.index,
    },
    lineTo: {
      line: i,
      index: line.length,
    },
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

  const eventDescription = new EventDescription(eventGroup, matchedListItems);
  const event = new Event(line, eventRanges, eventDescription);

  if (event) {
    context.push(new Node(event));
    // if (context.eventSubgroup) {
    //   context.eventSubgroup.push(event);
    // } else {
    //   context.events.push(event);
    // }

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
    // if (context.eventSubgroup) {
    //   context.events.push(context.eventSubgroup);
    // }
    // context.finishFoldableSection(i, lengthAtIndex[i] + line.length);
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
    i = checkEvent(line, lines, i, lengthAtIndex, context);
  }

  // if (context.eventSubgroup) {
  //   context.events.push(context.eventSubgroup);
  // }
  return context.toTimeline(
    lengthAtIndex,
    startLineIndex,
    lines.length - 1,
    // As this is the last timeline, return the length of the whole string
    lengthAtIndex[lines.length - 1] + lines[lines.length - 1].length
  );
}
