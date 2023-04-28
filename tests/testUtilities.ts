import { DateTime } from "luxon";
import { parse } from "../src";
import { Caches } from "../src/Cache";
import { iterate, isEventNode } from "../src/Noder";
import { Timelines, Event } from "../src/Types";

export const firstEvent = (markwhen: Timelines) => nthEvent(markwhen, 0);

export const nthEvent = (markwhen: Timelines, n: number) =>
  nthNode(markwhen, n).value as Event;

const nthNode = (markwhen: Timelines, n: number) => {
  let i = 0;
  for (const { path, node } of iterate(markwhen.timelines[0].events)) {
    if (isEventNode(node)) {
      if (i === n) {
        return node;
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
  for (const key of Object.keys(timers)) {
    const k = key as keyof typeof timers;
    console.log(
      `Average ${k} parse`,
      timers[k].reduce((p, c) => p + c, 0) / timers[k].length
    );
  }
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
  p().map((parse) => [parse, expected] as [(s: string) => Timelines, T]);

export const sp = () => sameParse([]);
