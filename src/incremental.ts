import { ChangeSet, Text } from "@codemirror/state";
import { DateTime } from "luxon";
import {
  Event,
  EventGroup,
  Eventy,
  get,
  isEvent,
  isGroup,
  iter,
  ParseResult,
  Path,
  Range,
} from "./Types";
import { parse, parsePastHeader } from "./parse";
import { Foldable, ParsingContext } from "./ParsingContext";
import { parseZone } from "./zones/parseZone";
import { Caches } from "./Cache";

function mapEventyThroughChanges(eventy: Eventy, changes: ChangeSet) {
  const m = changes.mapPos;
  if (isEvent(eventy)) {
    let { datePart, whole, recurrence } = eventy.textRanges;
    if (changes.touchesRange(datePart.from, datePart.to)) {
      throw new Error("date range affected");
    }
    datePart = {
      ...datePart,
      from: m(datePart.from),
      to: m(datePart.to),
    };
    eventy.textRanges.datePart = datePart;
    whole = {
      ...whole,
      from: m(whole.from),
      to: m(whole.to),
    };
    eventy.textRanges.whole = whole;
    if (recurrence) {
      if (changes.touchesRange(recurrence?.from, recurrence.to)) {
        throw new Error("recurrence affected");
      }
      recurrence = {
        ...recurrence,
        from: m(recurrence.from),
        to: m(recurrence.to),
      };
      eventy.textRanges.recurrence = recurrence;
    }
  } else {
    let { whole } = eventy.textRanges;
    whole = {
      ...whole,
      from: m(whole.from),
      to: m(whole.to),
    };
    eventy.textRanges.whole = whole;
  }
}

function touchesRanges(
  rangeA: [number, number] | Range,
  [fromB, toB]: [number, number]
) {
  let fromA, toA;
  if (Array.isArray(rangeA)) {
    [fromA, toA] = rangeA;
  } else {
    fromA = rangeA.from;
    toA = rangeA.to;
  }
  return toA >= fromB && toB >= fromA;
}

type EventyIterator = Generator<{ eventy: Eventy; path: Path }>;

const next = (it: EventyIterator) => {
  let {
    done,
    value: { eventy, path },
  }: { done?: boolean; value: { eventy: Eventy; path: Path } } = it.next();
  return { done, eventy, path };
};

type ChangedRange = {
  fromA: number;
  toA: number;
  fromB: number;
  toB: number;
  inserted: Text;
};

function asArray(changes: ChangeSet) {
  const c: ChangedRange[] = [];
  changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
    c.push({ fromA, toA, fromB, toB, inserted });
  });
  return c;
}

// skip this subtree and go to next sibling or up to next uncle
function skip(root: Eventy, p: Path) {
  let path = [...p];
  const last = path.at(-1);
  if (last === undefined) {
    return;
  }
  path = [...path.slice(0, -1), last + 1];
  while (!get(root, path)) {
    // We can't just pop because we don't want to just go up,
    // that would just put us at our parent's and liable
    // to reenter the node we're trying to skip.
    path.pop();
    const last = path.at(-1);
    if (last === undefined) {
      return;
    }
    path = [...path.slice(0, -1), last + 1];
  }
  return path;
}

function getGraft({
  changedRange,
  root,
  done,
  eventy,
  path,
  eventyIterator,
  previousText,
  context,
  cache,
}: {
  changedRange: ChangedRange;
  root: Eventy;
  done: boolean | undefined;
  eventy: Eventy;
  path: Path;
  eventyIterator: EventyIterator;
  previousText: Text;
  context: () => ParsingContext;
  cache?: Caches;
}) {
  const { fromA, toA, fromB, toB, inserted } = changedRange;

  while (!done && !touchesRanges(eventy.textRanges.whole, [fromA, toA])) {
    if (isGroup(eventy)) {
      const newPath = skip(root, path);
      eventyIterator = iter(root, newPath);
    }
    ({ done, eventy, path } = next(eventyIterator));
  }

  previousText = previousText.replace(fromB, fromB + (toA - fromA), inserted);
  const lineFrom = previousText.lineAt(fromB);
  const lineTo = previousText.lineAt(toB);

  if (isGroup(eventy)) {
    if (!eventy.children.length) {
      const lines: string[] = [],
        lengths: number[] = [];
      const textIterator = previousText.iterLines(
        lineFrom.number,
        lineTo.number
      );

      let runningLength = lineFrom.from;
      for (const line of textIterator) {
        lines.push(line);
        runningLength += line.length;
        lengths.push(runningLength);
      }
      parsePastHeader(
        lineFrom.number - 1,
        context(),
        Array(lineFrom.number - 1).concat(lines),
        Array(lineFrom.number - 1).concat(lengths),
        cache
      );
    }

    // See if this actually only affects children
  }
}

function mapParseThroughChanges(
  parse: ParseResult,
  changes: ChangeSet,
  previousText: Text,
  now?: DateTime | string
): ParseResult {
  let eventyIterator = iter(parse.events);

  let { done, eventy, path } = next(eventyIterator);
  if (done || !(eventy as EventGroup).children.length) {
    throw new Error("unimplemented");
  }
  ({ done, eventy, path } = next(eventyIterator));

  let _context: ParsingContext;
  const context = () => {
    if (_context) {
      return _context;
    }
    _context = new ParsingContext(now);
    _context.header = parse.header;
    if (typeof _context.header.timezone !== "undefined") {
      const tz = parseZone(_context.header.timezone, parse.cache);
      if (tz) {
        _context.timezoneStack = [tz];
      }
    }
    return _context;
  };

  const changesArray = asArray(changes);
  for (let i = 0; i < changesArray.length; i++) {
    getGraft({
      changedRange: changesArray[i],
      root: parse.events,
      cache: parse.cache,
      context,
      done,
      eventy,
      eventyIterator,
      previousText,
      path,
    });
  }

  return parse;
}

export function incrementalParse(
  previousText: string | string[] | Text,
  changes: ChangeSet = ChangeSet.empty(previousText.length),
  previousParse?: ParseResult,
  now?: DateTime | string
): ParseResult {
  const text = () =>
    previousText instanceof Text
      ? previousText
      : Text.of(
          Array.isArray(previousText) ? previousText : previousText.split("\n")
        );
  const bail = () => parse(changes.apply(text()), true, now);

  if (changes.length !== previousText.length) {
    throw new RangeError(
      "Applying change set to a document with the wrong length"
    );
  }

  if (!previousParse) {
    return bail();
  }

  if (changes.empty) {
    return previousParse ? previousParse : bail();
  }

  const _previousParse: ParseResult = { ...previousParse };
  try {
    return mapParseThroughChanges(_previousParse, changes, text(), now);
  } catch (e) {
    throw e;
  }
}
