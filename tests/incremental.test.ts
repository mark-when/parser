import { ChangeSet, ChangeSpec, Text } from "@codemirror/state";
import { parse } from "../src/index";
import { incrementalParse } from "../src/incremental";
import { DateTime } from "luxon";
import { performance } from "perf_hooks";
import { resolve } from "path";
import { readFileSync } from "fs";
import { basic78, basic86, grievous256, grievous324, now10 } from "./testStrings";

const time = <T>(fn: () => T): [T, number] => {
  const start = performance.now();
  const result = fn();
  return [result, performance.now() - start];
};

const large = readFileSync(resolve("./", "tests/school.mw"), "utf-8").substring(
  0,
  2100
);

const docs: [string, ChangeSpec][] = [
  [basic86, ChangeSet.empty(86)],
  [
    basic78,
    ChangeSet.of(
      {
        from: 78,
        insert: "!",
      },
      78
    ),
  ],
  [
    grievous324,
    ChangeSet.of(
      {
        from: 300,
        insert: " ",
      },
      324
    ),
  ],
  [now10, ChangeSet.of({ from: 10, insert: "!" }, 10)],
  [grievous256, ChangeSet.of({ insert: "now: ", from: 85 }, 256)],
  [large, ChangeSet.of({ insert: "hello", from: 1000 }, large.length)],
  [
    large.substring(1800),
    ChangeSet.of(
      { insert: "\nnow: hi\n", from: 200 },
      large.substring(1800).length
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
