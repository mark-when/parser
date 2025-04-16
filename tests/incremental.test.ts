import { ChangeSet, ChangeSpec, Text } from "@codemirror/state";
import { parse } from "../src/index";
import { incrementalParse } from "../src/incremental";
import { DateTime } from "luxon";

const docs: [string, ChangeSpec][] = [
  [
    `title: markwhen
timezone: America/Los_Angeles

2025: event
property: value

hi`,
    ChangeSet.empty(78),
  ],
  [
    `title: markwhen
timezone: America/Los_Angeles

2025: event
property: value

hi`,
    ChangeSet.of(
      {
        from: 78,
        insert: "!",
      },
      78
    ),
  ],
];

describe("incremental parsing", () => {
  test.each(docs)("is the same", (original, changes) => {
    const now = DateTime.now();
    const origParse = parse(original, true, now);
    const newDoc = ChangeSet.of(changes, original.length).apply(
      Text.of(original.split("\n"))
    );
    const newParse = parse(newDoc.toString(), true, now);

    expect(newParse).toEqual(
      incrementalParse(
        original,
        ChangeSet.of(changes, original.length),
        origParse,
        now
      )
    );
  });
});
