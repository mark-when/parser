import { DateTime } from "luxon";
import { NodeArray, SomeNode, Node } from "./Node.js";
import { push } from "./Noder.js";
import {
  Path,
  Tags,
  IdedEvents,
  AMERICAN_DATE_FORMAT,
  Line,
  Timeline,
  Range,
} from "./Types";

export interface Foldable {
  endIndex: number;
  type: "comment" | "section" | 'header';
  startLine: number;
  startIndex?: number;
  foldStartIndex?: number;
}

export class ParsingContext {
  now = DateTime.now();

  events: Node<NodeArray>;
  head?: SomeNode;
  tail?: SomeNode;
  currentPath: Path;

  tags: Tags;
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

  constructor() {
    this.events = new Node([]);
    this.tags = {};
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

  push(node: SomeNode) {
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

  endCurrentGroup(to: number, lineTo: Line) {
    this.currentPath.pop();
    // Assign text range
    // const group = this.events.get(this.currentPath) as Node<NodeArray>;
    // group.rangeInText!.lineTo = lineTo;
    // group.rangeInText!.to = to;
    this.finishFoldableSection(lineTo.line, to);
  }

  toTimeline(
    lengthAtIndex: number[],
    startLineIndex: number,
    endLineIndex: number,
    endStringIndex: number
  ): Timeline {
    const maxDurationDays = this.maxDuration
      ? this.maxDuration / 1000 / 60 / 60 / 24
      : this.now.diff(this.now.minus({ years: 1 })).as("days");
    return {
      events: this.events,
      head: this.head,
      tail: this.tail,
      tags: this.tags,
      ids: this.ids,
      ranges: this.ranges,
      foldables: this.foldables,
      header: this.header,
      metadata: {
        earliestTime: (this.earliest || this.now.minus({ years: 5 })).toISO(),
        latestTime: (this.latest || this.now.plus({ years: 5 })).toISO(),
        maxDurationDays,
        startLineIndex,
        startStringIndex: lengthAtIndex[startLineIndex],
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
