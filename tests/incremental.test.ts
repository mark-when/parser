import { ChangeSet, ChangeSpec, Text } from "@codemirror/state";
import { parse, ParseResult } from "../src/index";
import { incrementalParse } from "../src/incremental";
import { DateTime } from "luxon";
import { performance } from "perf_hooks";
import { resolve } from "path";
import { readFileSync } from "fs";
import {
  basic,
  basic78,
  basic86,
  eventsWithTz,
  grievous256,
  grievous324,
  now10,
  recurrence1,
  recurrence10,
  recurrence14,
} from "./testStrings";

const time = <T>(fn: () => T): [T, number] => {
  const start = performance.now();
  const result = fn();
  return [result, performance.now() - start];
};

const large = readFileSync(resolve("./", "tests/school.mw"), "utf-8").substring(
  0,
  10000
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
  [
    large.substring(1800),
    ChangeSet.of(
      { insert: "\nnow: hi\nnow: hi\n", from: 200 },
      large.substring(1800).length
    ),
  ],
  [large, ChangeSet.of({ insert: "", from: 900, to: 1000 }, large.length)],
  [
    `2025 - 2026: craziness`,
    ChangeSet.of(
      { insert: "", from: 12, to: 13 },
      `2025 - 2026: craziness`.length
    ),
  ],
  [basic, ChangeSet.of({ insert: "", from: 20, to: 40 }, basic.length)],
  [
    basic,
    ChangeSet.of({ insert: `\n${basic}`, from: basic.length }, basic.length),
  ],
  [
    [recurrence1, recurrence10, recurrence14].join("\n"),
    ChangeSet.of(
      { insert: "\n 5 years: ok \n", from: recurrence1.length + 5 },
      [recurrence1, recurrence10, recurrence14].join("\n").length
    ),
  ],
  [
    [recurrence1, "5 years: ok\n5 years: ok", recurrence14].join("\n"),
    ChangeSet.of(
      { insert: "\n 5 years: ok \n", from: recurrence1.length + 12 },
      [recurrence1, "5 years: ok\n5 years: ok", recurrence14].join("\n").length
    ),
  ],
  [
    [recurrence1, "5 years: ok", recurrence14].join("\n"),
    ChangeSet.of(
      { insert: "\n 5 years: ok \n", from: recurrence1.length },
      [recurrence1, "5 years: ok", recurrence14].join("\n").length
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
    // console.log(
    //   `Parse: ${normalParseDuration}, Incremental: ${incParseDuration}`
    // );
    const { cache, ...np } = newParse;
    const { cache: incCaches, ...ip } = incParse;

    // The caches weren't matching due to one being an Object
    // versus the other an intance of Caches. Idk
    expect(np).toMatchObject(ip);
  });

  test.only("inc parse through document forwards", () => {
    const from = 150;
    const ts = eventsWithTz.substring(from, 200).split("");
    const now = DateTime.now();

    const base = eventsWithTz.substring(0, from);
    let originalParse: ParseResult | undefined;
    const incrementalRatio: [number, number, boolean][] = [];
    for (let i = 0; i < ts.length; i++) {
      let acc = base + ts.slice(0, i).join("");
      const change = ChangeSet.of(
        { insert: ts[i], from: acc.length },
        acc.length
      );
      const oldDoc = Text.of(acc.split("\n"));
      const newDoc = change.apply(oldDoc);
      const [newParse, normalParseDuration] = time(() =>
        parse(newDoc, true, now)
      );
      const [incParse, incParseDuration] = time(() =>
        incrementalParse(
          oldDoc,
          ChangeSet.of(change, oldDoc.length),
          originalParse,
          now
        )
      );
      const { cache, ...np } = newParse;
      const { cache: incCaches, parser, ...ip } = incParse;
      incrementalRatio.push([
        normalParseDuration,
        incParseDuration,
        !!parser.incremental,
      ]);
      expect(np).toMatchObject(ip);
      originalParse = newParse;
    }
    console.log(incrementalRatio);
  });

  test("editing header in doc with events", () => {});
});
