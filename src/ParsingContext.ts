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
  Event,
  toDateRange,
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

export interface DocumentMessage {
  type: "error" | "warning";
  message: string;
}

export type ParseMessage = DocumentMessage & {
  pos: [number, number];
};

export class ParsingContext {
  now: DateTime;

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
  header: Record<string, any>;
  parseMessages: ParseMessage[] = [];
  documentMessages: DocumentMessage[] = [];
  cache?: Caches;

  constructor(
    now?: DateTime | string,
    cache?: Caches,
    getPriorEvent?: (c: ParsingContext) => Event | undefined
  ) {
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
    this.header = {};
    this.cache = cache;

    if (typeof now === "string") {
      const parsed = DateTime.fromISO(now);
      if (parsed.isValid) {
        this.now = parsed;
      } else {
        this.now = DateTime.now();
      }
    } else if (!now) {
      this.now = DateTime.now();
    } else {
      this.now = now;
    }

    if (getPriorEvent) {
      this.priorEvent = () => getPriorEvent(this);
    }
  }

  get zonedNow(): DateTime {
    return this.now.setZone(this.timezone);
  }

  public get timezone(): Zone {
    return this.parentZone();
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
    return path;
  }

  endCurrentGroup(to: number, lineTo: { line: number; index: number }) {
    this.currentPath.pop();
    // Assign text range
    const group = get(this.events, this.currentPath);
    group!.textRanges.whole = {
      ...group!.textRanges.whole,
      to: to,
    };
    this.finishFoldableSection(lineTo.line, to);
  }

  toTimeline(): Timeline & { parseMessages: ParseMessage[] } {
    const maxDurationDays = this.maxDuration
      ? this.maxDuration / 1000 / 60 / 60 / 24
      : 0;
    return {
      events: this.events,
      ids: this.ids,
      ranges: this.ranges.sort(
        ({ from: fromA }, { from: fromB }) => fromA - fromB
      ),
      foldables: this.foldables,
      header: this.header,
      parseMessages: this.parseMessages.sort(
        ({ pos: posA, message: messageA }, { pos: posB, message: messageB }) =>
          posA[0] - posB[0]
      ),
      documentMessages: this.documentMessages,
    };
  }

  priorEvent() {
    return this.tail;
  }

  parentZone(): Zone {
    const p = [...this.currentPath];
    p.pop();
    while (p.length) {
      const parent = get(this.events, p);
      const zone = timezoneFromProperties(parent?.properties ?? [], this.cache);
      if (zone) {
        return zone;
      }
      p.pop();
    }
    return (
      parseZone(this.header.timezone ?? this.header.tz, this.cache) ??
      SystemZone.instance
    );
  }

  priorEventToDateTime() {
    const prior = this.priorEvent();
    if (!prior) {
      return;
    }
    return toDateRange(prior.dateRangeIso).toDateTime;
  }

  priorEventFromDateTime() {
    const prior = this.priorEvent();
    if (!prior) {
      return;
    }
    return toDateRange(prior.dateRangeIso).fromDateTime;
  }

  getById(id: string) {
    const path = this.ids[id];
    if (!path) {
      return;
    }
    return get(this.events, path);
  }
}

export function timezoneFromProperties(
  properties: [string, any][] | Record<string, any>,
  cache?: Caches
) {
  if (Array.isArray(properties)) {
    const timezoneProperty = properties.find(([k, v]) => {
      return (
        (k === "tz" || k === "timezone") &&
        (typeof v === "string" || typeof v === "number")
      );
    });
    if (timezoneProperty) {
      return parseZone(timezoneProperty[1], cache);
    }
  } else {
    const tz = properties?.timezone ?? properties?.tz;
    if (tz) {
      return parseZone(tz, cache);
    }
  }
}
