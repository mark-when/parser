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

const DETERMINISTIC_NOW = DateTime.fromISO("2025-01-01T00:00:00.000Z");

const toText = (raw: string) => Text.of(raw.split("\n"));

const stripParseResult = ({ cache, parser, ...rest }: ParseResult) => rest;

const assertParity = (
  originalRaw: string,
  change: ChangeSet,
  now: DateTime = DETERMINISTIC_NOW
) => {
  const originalDoc = toText(originalRaw);
  const originalParse = parse(originalDoc, true, now);
  const [fullParse, fullDuration] = time(() =>
    parse(change.apply(originalDoc), true, now)
  );
  const [incremental, incrementalDuration] = time(() =>
    incrementalParse(originalDoc, change, originalParse, now)
  );
  expect(stripParseResult(fullParse)).toEqual(stripParseResult(incremental));
  return {
    fullDuration,
    incrementalDuration,
    parser: incremental.parser,
  };
};

type ParityCase = {
  name: string;
  seed: string;
  buildChange: (ctx: { raw: string; doc: Text }) => ChangeSet;
  now?: DateTime;
};

const runParityCase = ({
  name,
  seed,
  buildChange,
  now = DETERMINISTIC_NOW,
}: ParityCase) => {
  test(name, () => {
    const doc = toText(seed);
    const change = buildChange({ raw: seed, doc });
    assertParity(seed, change, now);
  });
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
    const changeSet = ChangeSet.of(changes, original.length);
    assertParity(original, changeSet);
  });

  describe("multiple changes in one ChangeSet", () => {
    test("handles spaced insert and replace", () => {
      const seed = `2025-01-01: Alpha
2025-02-01: Beta
2025-03-01: Gamma
`;

      const alphaStart = seed.indexOf("Alpha");
      const betaStart = seed.indexOf("Beta");

      const change = ChangeSet.of(
        [
          { from: alphaStart, to: alphaStart + "Alpha".length, insert: "Zeta" },
          { from: betaStart + "Beta".length, insert: " (cool)" },
        ],
        seed.length
      );

      assertParity(seed, change);
    });

    test("handles head and tail edits together", () => {
      const seed = `title: demo

2025-01-01: First event
2025-02-01: Second event
`;

      const firstStart = seed.indexOf("First event");
      const tailPos = seed.length;

      const change = ChangeSet.of(
        [
          { from: 0, insert: "// note: multi-change\n" },
          { from: firstStart, to: firstStart + "First".length, insert: "Initial" },
          { from: tailPos, insert: "2025-03-01: Third event\n" },
        ],
        seed.length
      );

      assertParity(seed, change);
    });
  });

  describe("targeted parity scenarios", () => {
    const relativeChain = [recurrence1, "5 years: ok", recurrence14].join(
      "\n"
    );

    runParityCase({
      name: "relative events stay anchored after insertion",
      seed: relativeChain,
      buildChange: ({ raw }) => {
        const insertionPoint = recurrence1.length + 1;
        return ChangeSet.of(
          {
            from: insertionPoint,
            insert: "5 years: inserted relative\n",
          },
          raw.length
        );
      },
    });

    runParityCase({
      name: "relative events realign after anchor deletion",
      seed: relativeChain,
      buildChange: ({ raw }) => {
        const deleteStart = recurrence1.length + 1;
        const deleteLength = "5 years: ok".length + 1;
        return ChangeSet.of(
          {
            from: deleteStart,
            to: deleteStart + deleteLength,
            insert: "",
          },
          raw.length
        );
      },
    });

    runParityCase({
      name: "timezone updates propagate through nested groups",
      seed: eventsWithTz,
      buildChange: ({ raw }) => {
        const target = "tz: +6";
        const from = raw.indexOf(target);
        if (from === -1) {
          throw new Error("Target substring not found in seed doc");
        }
        return ChangeSet.of(
          {
            from,
            to: from + target.length,
            insert: "tz: +7",
          },
          raw.length
        );
      },
    });
  });

  test("inc parse through document forwards", () => {
    const from = 0;
    const ts = eventsWithTz.split("");
    const now = DETERMINISTIC_NOW;

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
      const parser = incParse.parser;
      incrementalRatio.push([
        normalParseDuration,
        incParseDuration,
        !!parser.incremental,
      ]);
      try {
        expect(stripParseResult(newParse)).toMatchObject(
          stripParseResult(incParse)
        );
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
    const now = DETERMINISTIC_NOW;

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
      const parser = incParse.parser;
      incrementalRatio.push([
        normalParseDuration,
        incParseDuration,
        !!parser.incremental,
      ]);
      try {
        expect(stripParseResult(newParse)).toMatchObject(
          stripParseResult(incParse)
        );
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
    assertParity(ex, change);
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
