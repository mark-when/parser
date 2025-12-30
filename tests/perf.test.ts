import { performance } from "perf_hooks";
import { ChangeSet, Text } from "@codemirror/state";
import { parse, incrementalParse, profileParse } from "../src/index";

const RUN_PERF = process.env.PARSER_PERF === "1";
const baselineYear = new Date().getFullYear();

const describePerf = RUN_PERF ? describe : describe.skip;

function buildTimeline({ eventsPerGroup = 500, groups = 4 }): string {
  const lines: string[] = [
    `title: perf harness`,
    `description: synthetic corpus for parser perf profiling`,
    ``,
  ];

  let eventCounter = 0;
  for (let g = 0; g < groups; g++) {
    lines.push(`group Group ${g + 1} #g${g}`);
    for (let e = 0; e < eventsPerGroup; e++) {
      const year = baselineYear + ((e + g) % 5);
      const month = ((e % 12) + 1).toString().padStart(2, "0");
      const day = ((e % 27) + 1).toString().padStart(2, "0");
      lines.push(
        `${year}-${month}-${day}: Event ${eventCounter} #tag${e % 17}`
      );
      lines.push(`- checklist item ${e}`);
      lines.push(`// comment ${eventCounter}`);
      lines.push(
        `More description for event ${eventCounter} with link [example](https://example.com/${eventCounter}).`
      );
      eventCounter++;
    }
    lines.push(`end`);
    lines.push("");
  }

  return lines.join("\n");
}

function time<T>(fn: () => T): { value: T; ms: number } {
  const start = performance.now();
  const value = fn();
  return { value, ms: performance.now() - start };
}

describePerf("parser perf harness (set PARSER_PERF=1)", () => {
  const corpus = buildTimeline({ eventsPerGroup: 400, groups: 5 });

  test("baseline parse timings", () => {
    const runs = 4;
    const timings: number[] = [];
    let resultLength = 0;

    for (let i = 0; i < runs; i++) {
      const { value, ms } = time(() => parse(corpus));
      timings.push(ms);
      resultLength = value.ranges.length;
    }

    const warm = timings.slice(1); // drop first warmup
    const avg = warm.reduce((a, b) => a + b, 0) / warm.length;
    const min = Math.min(...warm);
    const max = Math.max(...warm);

    console.info(
      `[perf] parse baseline avg=${avg.toFixed(2)}ms min=${min.toFixed(
        2
      )}ms max=${max.toFixed(2)}ms ranges=${resultLength}`
    );

    expect(resultLength).toBeGreaterThan(0);
  }, 15000);

  test("incremental vs full parse", () => {
    const text = Text.of(corpus.split("\n"));
    const base = parse(text);

    const insert = `\n${baselineYear}-12-31: inserted event #new\n- a checklist\n`;
    const change = ChangeSet.of(
      { from: text.length >> 1, to: (text.length >> 1) + 5, insert },
      text.length
    );

    const full = time(() => parse(change.apply(text)));
    const inc = time(() => incrementalParse(text, change, base));

    console.info(
      `[perf] incremental parse ${inc.ms.toFixed(
        2
      )}ms vs full ${full.ms.toFixed(2)}ms (delta ${(full.ms - inc.ms).toFixed(
        2
      )}ms)`
    );

    expect(inc.value.events.children.length).toBeGreaterThan(0);
  }, 15000);

  test("cache init and reuse", () => {
    const runs = 3;
    const noCache: number[] = [];
    const withCache: number[] = [];

    for (let i = 0; i < runs; i++) {
      noCache.push(time(() => parse(corpus)).ms);
    }

    const { value: cold, ms: initMs } = time(() => parse(corpus, true));
    expect(cold.cache).toBeDefined();

    for (let i = 0; i < runs; i++) {
      withCache.push(time(() => parse(corpus, cold.cache)).ms);
    }

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    console.info(
      `[perf] cache init ${initMs.toFixed(2)}ms, avg no-cache ${avg(
        noCache
      ).toFixed(2)}ms, avg with-cache ${avg(withCache).toFixed(2)}ms`
    );

    expect(withCache.length).toBe(runs);
  }, 15000);

  test("phase timings", () => {
    const { parseResult, timings } = profileParse(corpus);

    console.info(
      `[perf] phases lines=${timings.lines.toFixed(2)}ms header=${timings.header.toFixed(
        2
      )}ms body=${timings.body.toFixed(2)}ms total=${timings.total.toFixed(2)}ms`
    );

    expect(parseResult.events.children.length).toBeGreaterThan(0);
  }, 15000);
});
