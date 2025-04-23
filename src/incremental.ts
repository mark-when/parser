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
  iterateTreeFromPath,
  ParseResult,
  Path,
  Range,
} from "./Types";
import { parse, parsePastHeader } from "./parse";
import { Foldable, ParseMessage, ParsingContext } from "./ParsingContext";

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

function getFromAndTo(
  change: ChangeSet,
  affected: Eventy[],
  preChange: boolean = true
) {
  let min = Number.POSITIVE_INFINITY,
    max = -1;

  if (!affected.length) {
    change.iterChangedRanges((fromA, toA, fromB, toB) => {
      if (fromB < min) {
        min = fromB;
      }
      if (toB > max) {
        max = toB;
      }
    });
    return [min, max];
  }

  for (let i = 0; i < affected.length; i++) {
    const { from, to } = affected[i].textRanges.whole;
    if (from < min) {
      min = from;
    }
    if (to > max) {
      max = to;
    }
  }

  let newFrom = preChange ? change.mapPos(min) : min;
  let newTo = preChange ? change.mapPos(max) : max;

  if (preChange) {
    change.iterChangedRanges((fromA, toA, fromB, toB) => {
      if (fromB < newFrom) {
        newFrom = fromB;
      }
      if (toB > newTo) {
        newTo = toB;
      }
    });
  }

  return [newFrom, newTo];
}

function linesAndLengths(
  newText: Text,
  change: ChangeSet,
  affected: Eventy[],
  preChange: boolean = true
) {
  const [newFrom, newTo] = getFromAndTo(change, affected, preChange);
  const lineFrom = newText.lineAt(newFrom);
  const lineTo = newText.lineAt(newTo);

  // Make sure we get complete lines
  const textSlice = newText.slice(lineFrom.from, newTo);
  const textLines = textSlice.toString().split("\n");

  const lines: string[] = textLines;
  const lengths: number[] = [];

  // Initialize with the starting position
  lengths.push(lineFrom.from);

  let runningLength = lineFrom.from;
  for (let i = 0; i < lines.length; i++) {
    runningLength += lines[i].length + (i === lines.length - 1 ? 0 : 1);
    lengths.push(runningLength);
  }

  return { from: lineFrom.number - 1, lines, lengths };
}

function getIds(eventies: Eventy[]): string[] {
  const ids: string[] = [];
  for (let i = 0; i < eventies.length; i++) {
    const e = eventies[i];
    if (isGroup(e)) {
      ids.push(...getIds(e.children));
    } else {
      if (e.id) {
        ids.push(e.id);
      }
    }
  }
  return ids;
}

function getTags(eventies: Eventy[]): string[] {
  const tags: string[] = [];
  for (let i = 0; i < eventies.length; i++) {
    const e = eventies[i];
    if (isGroup(e)) {
      tags.push(...e.tags);
      tags.push(...getTags(e.children));
    } else {
      if (e.tags) {
        tags.push(...e.tags);
      }
    }
  }
  return tags;
}

function graft({
  changedRange,
  previousParse,
  done,
  eventy,
  path,
  eventyIterator,
  previousText,
  now,
}: {
  changedRange: ChangedRange;
  done: boolean | undefined;
  eventy: Eventy;
  path: Path;
  eventyIterator: EventyIterator;
  previousText: Text;
  previousParse: ParseResult;
  now?: DateTime | string;
}) {
  const { events: root } = previousParse;
  const { fromA, toA, fromB, inserted } = changedRange;

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

  let lastUnaffected = { eventy, path };
  let prior: { eventy: Eventy; path: Path } | undefined;
  let noneAffected = false;
  while (!done && !touchesRanges(eventy.textRanges.whole, [fromA, toA])) {
    if (prior) {
      lastUnaffected = prior;
    }
    prior = { eventy, path };
    if (isGroup(eventy)) {
      const newPath = skip(root, path);
      if (!newPath) {
        noneAffected = true;
        break;
      }
      eventyIterator = iterateTreeFromPath(root, newPath!);
    }
    n();
  }

  const affected: { path: Path; eventy: Eventy }[] = [];
  if (!noneAffected) {
    // If we are editing the definition of an event or section, we might ablate it completely,
    // so we need to assume the prior event will be affected as well
    if (prior) {
      if (touchesRanges(eventy.textRanges.definition, [fromA, toA])) {
        affected.push(prior);
      } else {
        lastUnaffected = prior;
      }
    }

    // Now accumulate all the affected eventies
    do {
      affected.push({ eventy, path });
      n();
    } while (!done && touchesRanges(eventy.textRanges.whole, [fromA, toA]));
  }

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

  const affectedEventies = affected.map(({ eventy }) => eventy);
  if (getIds(affectedEventies).length) {
    throw new Error("Won't reparse over ided events");
  }

  const _change = ChangeSet.of(
    { from: fromA, to: toA, insert: inserted },
    previousText.length
  );
  const newText = previousText.replace(fromB, fromB + (toA - fromA), inserted);

  const withAffected = (
    affectedEventies: Eventy[],
    lastUnaffected: Eventy | undefined
  ) => {
    const { from, lines, lengths } = linesAndLengths(
      newText,
      _change,
      affectedEventies
    );

    const context = () => {
      const _context = new ParsingContext(
        now,
        previousParse.cache,
        (_c: ParsingContext) => {
          if (_c.tail) {
            return _c.tail;
          }
          if (lastUnaffected) {
            if (isEvent(lastUnaffected)) {
              return lastUnaffected;
            }
            throw new Error(
              "Last unaffected eventy to relate to is not an event"
            );
          }
        }
      );
      _context.getById = (id: string) => {
        const path = previousParse.ids[id];
        if (!path) {
          return;
        }
        return get(previousParse.events, path);
      };
      _context.header = previousParse.header;
      _context.ids = previousParse.ids;
      return _context;
    };

    const c = parsePastHeader(
      from,
      context(),
      Array(from).concat(lines),
      Array(from).concat(lengths)
    );
    return {
      context: c,
      affectedFrom: lengths[0],
      affectedTo: lengths.at(-1)!,
    };
  };

  const withCommonAncestor = () => {
    const commonAncestor = getCommonAncestor(affected.map(({ path }) => path));
    if (commonAncestor.length) {
      const ancestor = get(root, commonAncestor);
      if (ancestor) {
        affected.splice(0, affected.length, {
          path: commonAncestor,
          eventy: ancestor,
        });
        return withAffected(
          affected.map(({ eventy }) => eventy),
          lastUnaffected.eventy
        );
      }
    }
  };

  let result:
    | {
        context: ParsingContext;
        affectedFrom: number;
        affectedTo: number;
      }
    | undefined;
  if (areSiblings(affected.map(({ path }) => path))) {
    result = withAffected(
      affected.map(({ eventy }) => eventy),
      lastUnaffected.eventy
    );
  } else {
    result = withCommonAncestor();
  }

  if (!result) {
    throw new Error("No common ancestor found");
  }
  let { context: c, affectedFrom, affectedTo } = result;

  if (c.events.children.length) {
    splice(
      root,
      affected.map(({ path }) => path),
      c.events.children
    );
  }

  let lastToBeRelativeTo: Event;
  const relativeContext = new ParsingContext(now, previousParse.cache, (_c) => {
    if (_c.tail) {
      return _c.tail;
    }
    if (lastToBeRelativeTo) {
      if (isEvent(lastToBeRelativeTo)) {
        return lastToBeRelativeTo;
      }
      throw new Error("Last unaffected eventy to relate to is not an event");
    }
  });
  relativeContext.header = { ...previousParse.header };
  relativeContext.ids = { ...previousParse.ids };
  relativeContext.getById = (id: string) => {
    const path = previousParse.ids[id];
    if (!path) {
      return;
    }
    return get(previousParse.events, path);
  };

  const m = (i: number) => _change.mapPos(i);
  const mapRange = (r: Range): Range => {
    return {
      ...r,
      from: m(r.from),
      to: m(r.to),
    };
  };

  const from = affected.at(-1);
  if (from) {
    outer: for (const { eventy, path } of iterateTreeFromPath(
      root,
      from.path
    )) {
      for (const { eventy: newEventy } of iter(c.events)) {
        if (!newEventy.textRanges) {
          // The root doesn't have text ranges... it probably should though??
          continue;
        }
        if (isEvent(newEventy)) {
          lastToBeRelativeTo = newEventy;
        }
        if (
          newEventy.textRanges.whole.from === eventy.textRanges.whole.from &&
          newEventy.textRanges.whole.to === eventy.textRanges.whole.to
        ) {
          continue outer;
        }
      }
      if (isGroup(eventy)) {
        eventy.textRanges.whole = mapRange(eventy.textRanges.whole);
      } else {
        eventy.textRanges.datePart = mapRange(eventy.textRanges.datePart);
        eventy.textRanges.whole = mapRange(eventy.textRanges.whole);
        eventy.textRanges.definition = mapRange(eventy.textRanges.definition);
        if (eventy.textRanges.recurrence) {
          eventy.textRanges.recurrence = mapRange(eventy.textRanges.recurrence);
        }
        if (eventy.isRelative) {
          const { from, lines, lengths } = linesAndLengths(
            newText,
            _change,
            [eventy],
            false
          );

          const c = parsePastHeader(
            from,
            relativeContext,
            Array(from).concat(lines),
            Array(from).concat(lengths)
          );
          if (c.events.children.length !== 1) {
            throw new Error("Tried to update relative event and failed");
          } else {
            splice(root, [path], c.events.children);
          }
        }
      }
    }
  }

  mapRanges(
    previousParse,
    c,
    affectedFrom,
    affectedTo,
    _change,
    previousText,
    newText
  );
}

function areSiblings(affected: Path[]): boolean {
  if (affected.length < 2) {
    return true;
  }
  const parent = affected[0].slice(0, -1).join(",");
  const length = affected[0].length;
  const leaves = [affected[0].at(-1)!];
  for (let i = 1; i < affected.length; i++) {
    const path = affected[i];
    if (path.length !== length || path.slice(0, -1).join(",") !== parent) {
      return false;
    }
    const leaf = path.at(-1)!;
    if (!leaves.some((x) => Math.abs(leaf - x) === 1)) {
      return false;
    }
    leaves.push(leaf);
  }
  return true;
}

function mapRanges(
  previousParse: ParseResult,
  c: ParsingContext,
  affectedFrom: number,
  affectedTo: number,
  _change: ChangeSet,
  previousText: Text,
  newText: Text
) {
  const m = (i: number) => _change.mapPos(i);

  const { foldables } = previousParse;
  let newFoldables: { [index: number]: Foldable } = {};
  // all this foldable shit sucks
  for (const [foldableIndex, foldable] of Object.entries(foldables)) {
    const index = m(parseInt(foldableIndex));
    if (index < affectedFrom || index >= affectedTo) {
      newFoldables[index] = {
        ...foldable,
        endIndex: _change.mapPos(foldable.endIndex),
        foldStartIndex:
          foldable.foldStartIndex !== undefined
            ? _change.mapPos(foldable.foldStartIndex)
            : undefined,
        startIndex:
          foldable.startIndex !== undefined
            ? _change.mapPos(foldable.startIndex)
            : undefined,
        startLine:
          newText.lineAt(
            _change.mapPos(previousText.line(foldable.startLine + 1).from)
          ).number - 1,
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
    const to = m(range.to);
    const from = m(range.from);
    if (to < affectedFrom) {
      newRanges.push(range);
    } else if (from >= affectedTo) {
      newRanges.push({
        ...range,
        from,
        to,
      });
    }
  }
  previousParse.ranges = [
    ...newRanges,
    ...c.ranges.filter(
      ({ from, to }) => from >= affectedFrom && to <= affectedTo
    ),
  ].sort(({ from: fromA }, { from: fromB }) => fromA - fromB);

  let newMessages: ParseMessage[] = [];
  for (const message of previousParse.parseMessages) {
    const from = m(message.pos[0]);
    const to = m(message.pos[1]);
    if (to < affectedFrom) {
      newMessages.push(message);
    } else if (from > affectedTo) {
      newMessages.push({
        ...message,
        pos: [from, to],
      });
    }
  }
  previousParse.parseMessages = [...newMessages, ...c.parseMessages].sort(
    ({ pos: posA }, { pos: posB }) => posA[0] - posB[0]
  );
}

function splice(root: EventGroup, affectedPaths: Path[], eventies: Eventy[]) {
  if (!affectedPaths.length) {
    root.children.splice(root.children.length, 0, ...eventies);
    return;
  }

  if (!areSiblings(affectedPaths)) {
    throw new Error("Can't splice non-siblings");
  }

  const youngest = affectedPaths.reduce((prev, curr) => {
    return curr.at(-1)! < prev.at(-1)! ? curr : prev;
  });

  while (youngest.length > 1) {
    root = root.children[youngest.shift()!] as EventGroup;
  }
  root.children.splice(youngest[0], affectedPaths.length, ...eventies);
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
      now,
      done,
      eventy,
      eventyIterator,
      previousText,
      path,
    });
  }
  parse.parser.incremental = true;
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
  const bail = () => {
    return parse(changes.apply(text()), previousParse?.cache, now);
  };

  if (changes.length !== previousText.length) {
    throw new RangeError(
      "Applying change set to a document with the wrong length"
    );
  }

  if (!previousParse || !previousParse.events.children.length) {
    return bail();
  }

  if (changes.empty) {
    return previousParse ? previousParse : bail();
  }

  const _previousParse: ParseResult = { ...previousParse };
  try {
    return mapParseThroughChanges(_previousParse, changes, text(), now);
  } catch (e) {
    if ((e as Error).message === "Won't reparse over ided events") {
      return bail();
    }
    console.error(e);
    throw e;
  }
}
