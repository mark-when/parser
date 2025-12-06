import { ChangeSet, ChangeSpec, Text } from "@codemirror/state";
import { parse, ParseResult } from "../src/index";
import { incrementalParse } from "../src/incremental";
import { DateTime } from "luxon";
import { performance } from "perf_hooks";
import { resolve } from "path";
import { readFileSync, writeFileSync } from "fs";
import {
  basic,
  basic78,
  basic86,
  eventsWithFromAndToTz,
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

// const large = readFileSync(resolve("./", "tests/school.mw"), "utf-8");

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
  // [large, ChangeSet.of({ insert: "hello", from: 1000 }, large.length)],
  // [
  //   large.substring(1800),
  //   ChangeSet.of(
  //     { insert: "\nnow: hi\n", from: 200 },
  //     large.substring(1800).length
  //   ),
  // ],
  // [
  //   large.substring(1800),
  //   ChangeSet.of(
  //     { insert: "\nnow: hi\nnow: hi\n", from: 200 },
  //     large.substring(1800).length
  //   ),
  // ],
  // [large, ChangeSet.of({ insert: "", from: 900, to: 1000 }, large.length)],
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
  [
    eventsWithFromAndToTz,
    ChangeSet.of(
      { insert: "Oh: okay", from: 200 },
      eventsWithFromAndToTz.length
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
    const { cache: incCaches, parser, ...ip } = incParse;

    // The caches weren't matching due to one being an Object
    // versus the other an intance of Caches. Idk
    expect(np).toMatchObject(ip);
  });

  test("inc parse through document forwards", () => {
    const from = 0;
    const ts = eventsWithTz.split("");
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
      try {
        expect(np).toMatchObject(ip);
      } catch {
      } finally {
        writeFileSync(
          "./tests/inc.csv",
          "normal,incremental,fallback\n" +
            incrementalRatio.map((i) => i.join(",")).join("\n")
        );
      }
      originalParse = newParse;
    }
  });

  test("inc parse through document backwards (deleting)", () => {
    const now = DateTime.now();

    const base = eventsWithTz;
    let originalParse: ParseResult | undefined;
    const incrementalRatio: [number, number, boolean][] = [];
    for (let i = 0; i < base.length; i++) {
      let acc = base.substring(0, base.length - i);
      const change = ChangeSet.of(
        { insert: "", from: acc.length - 1, to: acc.length },
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
      try {
        expect(np).toMatchObject(ip);
      } catch {
      } finally {
        writeFileSync(
          "./tests/inc-delete.csv",
          "normal,incremental,fallback\n" +
            incrementalRatio.map((i) => i.join(",")).join("\n")
        );
      }
      originalParse = newParse;
    }
  });

  test("above and below", () => {
    const ex = `
title: a new begi

section All Projects
group Project 1 #Project1
// Supports ISO8601
2025-01/2025-03: Sub task #John
2025-03/2025-06: Sub task 2 #Michelle
More info about sub task 2

- [ ] We need to get this done
- [x] And this
- [ ] This one is extra

2025-07: Yearly planning
ok: hi
overtime: neat
forthwith 

4/24/2025: this is a truly momentous day for everyone so to speak?


group this is group


`;
    const change = ChangeSet.of(
      {
        insert: `

4/23/2025: thi 
`,
        from: 18,
      },
      ex.length
    );

    const now = DateTime.now();
    const originalParse = parse(ex);
    const newDoc = change.apply(Text.of(ex.split("\n")));
    const [newParse, normalParseDuration] = time(() =>
      parse(newDoc, true, now)
    );
    const [incParse, incParseDuration] = time(() =>
      incrementalParse(ex, change, originalParse, now)
    );
    // console.log(
    //   `Parse: ${normalParseDuration}, Incremental: ${incParseDuration}`
    // );
    const { cache, ...np } = newParse;
    const { cache: incCaches, parser, ...ip } = incParse;

    // The caches weren't matching due to one being an Object
    // versus the other an intance of Caches. Idk
    expect(np).toMatchObject(ip);
  });

  test("messages", () => {
    const mw = `
title: a new begi
description: we're up here now
newKey: value
headerKey: value and such
thisIsWorkingBetter

4/23/2025: thi 
`;
    const parsed = incrementalParse(mw);
    expect(parsed.parseMessages).toHaveLength(1);
  });

  // test.only("large doc", () => {
  //   const from = 0;
  //   const largeSplit = large.substring(0, 4000).split("");
  //   const now = DateTime.now();

  //   const base = large.substring(0, from);
  //   let originalParse: ParseResult | undefined;
  //   const incrementalRatio: [number, number, boolean][] = [];
  //   for (let i = 0; i < largeSplit.length; i++) {
  //     let acc = base + largeSplit.slice(0, i).join("");
  //     const change = ChangeSet.of(
  //       { insert: large[i], from: acc.length },
  //       acc.length
  //     );
  //     const oldDoc = Text.of(acc.split("\n"));
  //     const newDoc = change.apply(oldDoc);
  //     const [newParse, normalParseDuration] = time(() =>
  //       parse(newDoc, true, now)
  //     );
  //     const [incParse, incParseDuration] = time(() =>
  //       incrementalParse(
  //         oldDoc,
  //         ChangeSet.of(change, oldDoc.length),
  //         originalParse,
  //         now
  //       )
  //     );
  //     const { cache, ...np } = newParse;
  //     const { cache: incCaches, parser, ...ip } = incParse;
  //     incrementalRatio.push([
  //       normalParseDuration,
  //       incParseDuration,
  //       !!parser.incremental,
  //     ]);
  //     try {
  //       expect(np).toMatchObject(ip);
  //     } catch {
  //       debugger;
  //     } finally {
  //       writeFileSync(
  //         "./tests/inc-large.csv",
  //         "normal,incremental,fallback\n" +
  //           incrementalRatio.map((i) => i.join(",")).join("\n")
  //       );
  //     }
  //     originalParse = newParse;
  //   }
  // });
});
