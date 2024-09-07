import { DateTime, SystemZone, Zone } from "luxon";
import {
  Path,
  IdedEvents,
  AMERICAN_DATE_FORMAT,
  Timeline,
  Range,
  EventGroup,
  Eventy,
  push,
  get,
  isEvent,
  Event,
} from "./Types.js";
import { parseZone } from "./zones/parseZone.js";
import { Caches } from "./Cache.js";

export interface Foldable {
  endIndex: number;
  type: "comment" | "section" | "header" | "event";
  startLine: number;
  startIndex?: number;
  foldStartIndex?: number;
}

export class ParsingContext {
  now = DateTime.now();

  events: EventGroup;
  head?: Eventy;
  tail?: Event;
  currentPath: Path;

  ids: IdedEvents;
  title: string | undefined;
  description: string | undefined;
  paletteIndex: number;
  earliest: DateTime | undefined;
  latest: DateTime | undefined;
  maxDuration: number | undefined;
  foldables: {
    [F in number | string]: Foldable;
  };
  foldableSections: Foldable[];
  ranges: Range[];
  preferredInterpolationFormat: string | undefined;
  header: any;
  timezoneStack: Zone[];

  constructor() {
    this.events = new EventGroup();
    this.ids = {};
    this.paletteIndex = 0;
    this.earliest = undefined;
    this.latest = undefined;
    this.maxDuration = undefined;
    this.currentPath = [];
    this.foldables = {};
    this.foldableSections = [];
    this.ranges = [];
    this.header = { dateFormat: AMERICAN_DATE_FORMAT };
    this.timezoneStack = [new SystemZone()];
  }

  public get timezone(): Zone {
    return this.timezoneStack[this.timezoneStack.length - 1];
  }

  currentFoldableSection() {
    return this.foldableSections[this.foldableSections.length - 1];
  }

  currentFoldableComment() {
    return this.foldables["comment"];
  }

  startFoldableSection(f: Foldable) {
    this.foldableSections.push(f);
  }

  startFoldable(f: Foldable) {
    this.foldables[f.type] = f;
  }

  finishFoldableSection(line: number, endIndex: number) {
    const currentFoldableSection = this.foldableSections.pop();
    if (currentFoldableSection) {
      if (currentFoldableSection.startLine < line - 1) {
        this.foldables[currentFoldableSection.startIndex!] = {
          ...currentFoldableSection,
          endIndex,
        };
      }
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

  push(node: Eventy) {
    const { path, tail: newTail } = push(
      node,
      this.events,
      this.currentPath.slice(0, -1),
      this.tail
    );
    if (newTail) {
      if (!this.head) {
        this.head = newTail;
      }
      this.tail = newTail;
    }
    this.currentPath = path;
  }

  endCurrentGroup(
    to: number,
    lineTo: { line: number; index: number },
    cache?: Caches
  ) {
    this.currentPath.pop();
    // Pop timezone if necessary
    if (this.timezoneStack.length > 1) {
      const group = get(this.events, this.currentPath);
      if (group && !isEvent(group)) {
        const lastTagsDefinitionInHeader =
          group.tags?.length &&
          this.header[`)${group.tags[group.tags.length - 1]}`];
        if (
          typeof lastTagsDefinitionInHeader === "object" &&
          typeof lastTagsDefinitionInHeader.timezone !== "undefined"
        ) {
          const zone = parseZone(lastTagsDefinitionInHeader.timezone, cache);
          if (zone && this.timezone.equals(zone)) {
            this.timezoneStack.pop();
          }
        }
      }
    }
    // Assign text range
    // const group = this.events.get(this.currentPath) as Node<EventGroup>;
    // group.rangeInText!.lineTo = lineTo;
    // group.rangeInText!.to = to;
    this.finishFoldableSection(lineTo.line, to);
  }

  toTimeline(
    lengthAtIndex: number[],
    endLineIndex: number,
    endStringIndex: number
  ): Timeline {
    const maxDurationDays = this.maxDuration
      ? this.maxDuration / 1000 / 60 / 60 / 24
      : this.now.diff(this.now.minus({ years: 1 })).as("days");
    return {
      events: this.events,
      ids: this.ids,
      ranges: this.ranges,
      foldables: this.foldables,
      header: this.header,
      metadata: {
        earliestTime: (this.earliest || this.now.minus({ years: 5 })).toISO(),
        latestTime: (this.latest || this.now.plus({ years: 5 })).toISO(),
        maxDurationDays,
        startLineIndex: 0,
        startStringIndex: lengthAtIndex[0],
        endLineIndex,
        preferredInterpolationFormat: this.preferredInterpolationFormat,

        // minus one to make sure the newline character is always there
        endStringIndex,
        ...(this.title ? { title: this.title } : {}),
        ...(this.description ? { description: this.description } : {}),
      },
    };
  }
}
