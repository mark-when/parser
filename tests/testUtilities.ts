import { DateTime } from "luxon";
import { parse } from "../src";
import { Caches } from "../src/Cache";
import { ParseResult, Event, isEvent, iter } from "../src/Types";
import { performance } from "perf_hooks";

export const firstEvent = (markwhen: ParseResult) => nthEvent(markwhen, 0);

export const nthEvent = (markwhen: ParseResult, n: number) =>
  nthNode(markwhen, n) as Event;

const nthNode = (markwhen: ParseResult, n: number) => {
  let i = 0;
  for (const { path, eventy } of iter(markwhen.events)) {
    if (isEvent(eventy)) {
      if (i === n) {
        return eventy;
      }
      i++;
    }
  }
  throw new Error();
};

const timers = {
  normal: [] as number[],
  cacheInit: [] as number[],
  withCache: [] as number[],
};

export const currentYear = DateTime.now().year;

// afterAll(() => {
//   logTimingData();
// });

const logTimingData = () => {
  let log = "";
  for (const key of Object.keys(timers)) {
    const k = key as keyof typeof timers;
    log += `Average ${k} parse ${
      timers[k].reduce((p, c) => p + c, 0) / timers[k].length
    }\n`;
  }
  console.log(log);
};

const time = <T>(fn: () => T, timeKey: keyof typeof timers) => {
  const start = performance.now();
  const result = fn();
  timers[timeKey].push(performance.now() - start);
  return result;
};

const p = () => {
  let cache: Caches;
  return [
    (s: string) => {
      const result = time(() => parse(s, true), "cacheInit");
      cache = result.cache!;
      return result;
    },
    (s: string) => time(() => parse(s, cache), "withCache"),
    (s: string) => time(() => parse(s), "normal"),
  ];
};

export const sameParse = <T>(expected: T) =>
  p().map((parse) => [parse, expected] as [(s: string) => ParseResult, T]);

export const sp = () => sameParse([]);
