import { ChangeSet, Text } from "@codemirror/state";
import { DateTime } from "luxon";
import {
  EventGroup,
  Eventy,
  get,
  isGroup,
  iter,
  iterateTreeFromPath,
  iterFrom,
  ParseResult,
  Path,
  Range,
} from "./Types";
import { parse, parsePastHeader } from "./parse";
import { Foldable, ParsingContext } from "./ParsingContext";
import { parseZone } from "./zones/parseZone";

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

function getCommonAncestor(arrays: Path[]): Path {
  if (arrays.length === 0) return [];

  let prefix: Path = [];

  // Use the first array as a base for comparison
  const firstArray = arrays[0];

  for (let i = 0; i < firstArray.length; i++) {
    const currentValue = firstArray[i];

    // Check if this value is present at the same position in all other arrays
    for (let j = 1; j < arrays.length; j++) {
      if (i >= arrays[j].length || arrays[j][i] !== currentValue) {
        return prefix;
      }
    }

    // If all arrays have the same value at position i, add it to the prefix
    prefix.push(currentValue);
  }

  return prefix;
}

function linesAndLengths(newText: Text, change: ChangeSet, eventy: Eventy) {
  const newFrom = change.mapPos(eventy.textRanges.whole.from);
  const newTo = change.mapPos(eventy.textRanges.whole.to);
  const lineFrom = newText.lineAt(newFrom);
  const lineTo = newText.lineAt(newTo);

  const lines: string[] = [],
    lengths: number[] = [];
  const textIterator = newText.iterLines(lineFrom.number, lineTo.number + 1);

  let runningLength = lineFrom.from;
  for (const line of textIterator) {
    lines.push(line);
    lengths.push(runningLength);
    // plus one for newline
    runningLength += line.length + 1;
  }
  lengths.push(runningLength);

  return { from: lineFrom.number - 1, lines, lengths };
}

function graft({
  changedRange,
  previousParse,
  done,
  eventy,
  path,
  eventyIterator,
  previousText,
  context,
}: {
  changedRange: ChangedRange;
  done: boolean | undefined;
  eventy: Eventy;
  path: Path;
  eventyIterator: EventyIterator;
  previousText: Text;
  context: () => ParsingContext;
  previousParse: ParseResult;
}) {
  const { events: root, cache, foldables, ranges } = previousParse;
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
      eventyIterator = iterFrom(root, newPath!);
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
    { from: fromA, to: toA, insert: inserted },
    previousText.length
  );
  const newText = previousText.replace(fromB, fromB + (toA - fromA), inserted);

  const withEventy = (e: Eventy) => {
    const { from, lines, lengths } = linesAndLengths(newText, _change, e);
    const c = parsePastHeader(
      from,
      context(),
      Array(from).concat(lines),
      Array(from).concat(lengths),
      cache
    );
    return {
      context: c,
      affectedFrom: lengths[0],
      affectedTo: lengths.at(-1)!,
    };
  };
  let { context: c, affectedFrom, affectedTo } = withEventy(eventy);

  if (!c.events.children.length) {
    const commonAncestor = getCommonAncestor(affected.map(({ path }) => path));
    if (commonAncestor.length) {
      const ancestor = get(root, commonAncestor);
      if (ancestor) {
        affected.splice(0, affected.length, {
          path: commonAncestor,
          eventy: ancestor,
        });
        ({ context: c, affectedFrom, affectedTo } = withEventy(ancestor));
      }
    }
  }

  if (!c.events.children.length) {
    throw new Error("No children found");
  }

  const m = (i: number) => _change.mapPos(i);
  const mapRange = (r: Range): Range => {
    return {
      ...r,
      from: m(r.from),
      to: m(r.to),
    };
  };
  for (let i = affected.length - 1; i >= 0; i--) {
    if (i === affected.length - 1) {
      for (const { eventy } of iterateTreeFromPath(root, affected[i].path)) {
        if (isGroup(eventy)) {
          eventy.textRanges.whole = mapRange(eventy.textRanges.whole);
        } else {
          eventy.textRanges.datePart = mapRange(eventy.textRanges.datePart);
          eventy.textRanges.whole = mapRange(eventy.textRanges.whole);
          if (eventy.textRanges.recurrence) {
            eventy.textRanges.recurrence = mapRange(
              eventy.textRanges.recurrence
            );
          }
        }
      }
    }
    splice(root, affected[i].path, c.events.children[0]);
  }

  let newFoldables: { [index: number]: Foldable } = {};
  // all this foldable shit sucks
  for (const [foldableIndex, foldable] of Object.entries(foldables)) {
    const index = parseInt(foldableIndex);
    if (index < affectedFrom || index > affectedFrom) {
      newFoldables[index] = {
        ...foldable,
        endIndex: _change.mapPos(foldable.endIndex),
        foldStartIndex: foldable.foldStartIndex
          ? _change.mapPos(foldable.foldStartIndex)
          : undefined,
        startIndex: foldable.startIndex
          ? _change.mapPos(foldable.startIndex)
          : undefined,
        startLine: newText.lineAt(
          _change.mapPos(previousText.line(foldable.startLine).from)
        ).number,
      };
    }
  }
  newFoldables = {
    ...newFoldables,
    ...c.foldables,
  };
  previousParse.foldables = newFoldables;

  let newRanges: Range[] = [];
  for (const range of previousParse.ranges) {
    if (range.to < affectedFrom) {
      newRanges.push(range);
    } else if (range.from > affectedTo) {
      newRanges.push({
        content: range.content,
        type: range.type,
        from: m(range.from),
        to: m(range.to),
      });
    }
  }
  previousParse.ranges = [
    ...newRanges,
    ...c.ranges.filter(
      ({ from, to }) => from >= affectedFrom && to <= affectedTo
    ),
  ];
}

function splice(root: EventGroup, affectedPath: Path, eventy: Eventy) {
  while (affectedPath.length > 1) {
    root = root.children[affectedPath.shift()!] as EventGroup;
  }
  root.children.splice(affectedPath[0], 1, eventy);
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
  if (changesArray.length > 1) {
    throw new Error(
      "Can't incrementally parse more than one change at a time (yet)"
    );
  }

  for (let i = 0; i < changesArray.length; i++) {
    graft({
      changedRange: changesArray[i],
      previousParse: parse,
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
