import { ChangeSet, Text } from "@codemirror/state";
import { DateTime } from "luxon";
import {
  EventGroup,
  Eventy,
  get,
  isGroup,
  iter,
  ParseResult,
  Path,
  Range,
} from "./Types";
import { parse, parsePastHeader } from "./parse";
import { ParsingContext } from "./ParsingContext";
import { parseZone } from "./zones/parseZone";
import { Caches } from "./Cache";

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
    value,
  }: { done?: boolean; value: { eventy: Eventy; path: Path } } = it.next();
  return done ? { done } : { done, eventy: value.eventy, path: value.path };
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

  const n = () => {
    const iterate = next(eventyIterator);
    if (iterate.done) {
      done = true;
    } else {
      done = false;
      eventy = iterate.eventy;
      path = iterate.path;
    }
  };

  const affected: { path: Path; eventy: Eventy }[] = [];
  while (!done && !touchesRanges(eventy.textRanges.whole, [fromA, toA])) {
    if (isGroup(eventy)) {
      const newPath = skip(root, path);
      eventyIterator = iter(root, newPath);
    }
    n();
  }

  // Now accumulate all the affected eventies
  do {
    affected.push({ eventy, path });
    n();
  } while (!done && touchesRanges(eventy.textRanges.whole, [fromA, toA]));

  // If both a parent and children are affected, we can exclude the children
  // as we'll just reparse the whole parent node, children included.
  for (let i = 1; i < affected.length; i++) {
    const potentialChildPath = affected[i].path.join(",");
    const potentialParentPath = affected[i - 1].path.join(",");
    if (potentialChildPath.startsWith(potentialParentPath)) {
      affected.splice(i, 1);
      i--;
    }
  }

  const _change = ChangeSet.of(
    { from: fromB, to: toB, insert: inserted },
    previousText.length
  );
  previousText = previousText.replace(fromB, fromB + (toA - fromA), inserted);
  const newFrom = _change.mapPos(eventy.textRanges.whole.from);
  const newTo = _change.mapPos(eventy.textRanges.whole.to);
  const lineFrom = previousText.lineAt(newFrom);
  const lineTo = previousText.lineAt(newTo);

  const lines: string[] = [],
    lengths: number[] = [];
  const textIterator = previousText.iterLines(
    lineFrom.number,
    lineTo.number + 1
  );

  let runningLength = 0;
  for (const line of textIterator) {
    lines.push(line);
    lengths.push(runningLength);
    runningLength += line.length;
  }
  lengths.push(runningLength);
  const c = parsePastHeader(
    lineFrom.number - 1,
    context(),
    Array(lineFrom.number - 1).concat(lines),
    Array(lineFrom.number - 1).concat(lengths),
    cache
  );

  return { affectedPaths: affected, context: c };
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

  if (done || !eventy || !path) {
    throw new Error("Nothing to graft");
  }

  const context = () => {
    const _context = new ParsingContext(now);
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
    const { affectedPaths, context: parseContext } = getGraft({
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
