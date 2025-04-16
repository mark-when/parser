import { ChangeSet, Text } from "@codemirror/state";
import { DateTime } from "luxon";
import { Eventy, isEvent, iter, ParseResult } from "./Types";
import { parse } from "./parse";
import { Foldable } from "./ParsingContext";

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

function mapParseThroughChanges(
  parse: ParseResult,
  changes: ChangeSet
): ParseResult {
  for (const { eventy } of iter(parse.events)) {
    mapEventyThroughChanges(eventy, changes);
  }
  const newFoldables: { [key: number]: Foldable } = {};
  for (const [key, value] of Object.entries(parse.foldables)) {
    newFoldables[changes.mapPos(parseInt(key))] = value;
  }
  throw new Error()
}

export function incrementalParse(
  previousText: string | string[] | Text,
  changes: ChangeSet = ChangeSet.empty(previousText.length),
  previousParse?: ParseResult,
  now?: DateTime | string
): ParseResult {
  const bail = () => {
    const text =
      previousText instanceof Text
        ? previousText
        : Text.of(
            Array.isArray(previousText)
              ? previousText
              : previousText.split("\n")
          );
    return parse(changes.apply(text), true, now);
  };

  if (!previousParse) {
    return bail();
  }

  if (changes.empty) {
    return previousParse ? previousParse : bail();
  }

  const newParse: ParseResult = { ...previousParse };
  try {
    return mapParseThroughChanges(newParse, changes);
  } catch {
    return bail();
  }

  throw new Error("unimplemented");
}
