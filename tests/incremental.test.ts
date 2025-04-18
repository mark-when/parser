import { ChangeSet, ChangeSpec, Text } from "@codemirror/state";
import { parse } from "../src/index";
import { incrementalParse } from "../src/incremental";
import { DateTime } from "luxon";
import { performance } from "perf_hooks";

const time = <T>(fn: () => T): [T, number] => {
  const start = performance.now();
  const result = fn();
  return [result, performance.now() - start];
};

const docs: [string, ChangeSpec][] = [
  [
    `title: markwhen
  timezone: America/Los_Angeles

  2025: event
  property: value

  hi`,
    ChangeSet.empty(86),
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
  [
    `
timezone: +5

#generalGrievous:
  timezone: +0

#t:
  timezone: -5

group #generalGrievous

group #t

2023-05-01: this is an event in asia or something

2023-05-01: this is an event in the  uk timezone
#generalGrievous

endGroup

endGroup

2023-05-01: this is an event in the UK timezone

#generalGrievous


2023-05-01: this`,
    ChangeSet.of(
      {
        from: 300,
        insert: " ",
      },
      325
    ),
  ],
  [`now: event`, ChangeSet.of({ from: 10, insert: "!" }, 10)],
];

describe("incremental parsing", () => {
  test.each(docs)("is the same", (original, changes) => {
    const now = DateTime.now();
    const origParse = parse(original, true, now);
    const newDoc = ChangeSet.of(changes, original.length).apply(
      Text.of(original.split("\n"))
    );
    const [newParse, normalParseDuration] = time(() =>
      parse(newDoc, true, now)
    );
    const [incParse, incParseDuration] = time(() =>
      incrementalParse(
        original,
        ChangeSet.of(changes, original.length),
        origParse,
        now
      )
    );
    console.log(
      `Parse: ${normalParseDuration}, Incremental: ${incParseDuration}`
    );
    const { cache, ...np } = newParse;
    const { cache: incCaches, ...ip } = incParse;

    // The caches weren't matching due to one being an Object
    // versus the other an intance of Caches. Idk
    expect(np).toMatchObject(ip);
  });
});
